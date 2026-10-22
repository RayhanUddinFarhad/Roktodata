import mongoose from "mongoose";
import webpush from "web-push";
import { env } from "../config/env.js";
import { DISTRICT_COORDS, distanceKm } from "../config/districtCoords.js";
import { PatientRequest } from "../models/PatientRequest.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { dhakaDay } from "./dhakaDate.js";

export const pushEnabled = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
if (pushEnabled) webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

// A blood request reaches subscribers in its district and within this distance of its district town.
export const NEARBY_KM = 50;
// At most this many blood-request notifications per device per day, so people don't switch them off.
const MAX_REQUEST_PUSHES_PER_DAY = 3;
const CONCURRENCY = 25;

const bn = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

// Sends one notification to many devices. Devices the push service says are gone are deleted.
export async function sendPush(subscriptions, payload) {
  if (!pushEnabled || !subscriptions.length) return { sent: 0, failed: 0 };
  const body = JSON.stringify(payload);
  const gone = [];
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < subscriptions.length; i += CONCURRENCY) {
    await Promise.all(
      subscriptions.slice(i, i + CONCURRENCY).map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body, { TTL: 12 * 60 * 60, urgency: "high" });
          sent++;
        } catch (err) {
          failed++;
          if (err.statusCode === 404 || err.statusCode === 410) gone.push(sub._id);
          else console.error(`Push failed (${err.statusCode ?? "network"}): ${err.message}`);
        }
      }),
    );
  }
  if (gone.length) await PushSubscription.deleteMany({ _id: mongoose.trusted({ $in: gone }) });
  return { sent, failed: failed - gone.length, removed: gone.length };
}

// Subscribers in `district` or within NEARBY_KM of its town.
export async function nearbySubscriptions(district) {
  const town = DISTRICT_COORDS[district];
  const subs = await PushSubscription.find({}, { endpoint: 1, keys: 1, district: 1, lat: 1, lng: 1, requestPushDay: 1, requestPushCount: 1 }).lean();
  return subs.filter(
    (s) => s.district === district || (town && s.lat != null && s.lng != null && distanceKm([s.lat, s.lng], town) <= NEARBY_KM),
  );
}

// Notifies people near a newly published blood request. Each request is announced once, however
// often it is approved again, and only while it is recent.
export async function notifyBloodRequest(requestId) {
  if (!pushEnabled) return;
  const request = await PatientRequest.findOneAndUpdate(
    {
      _id: requestId,
      status: "Approved",
      notifiedAt: null,
      createdAt: mongoose.trusted({ $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }),
    },
    { $set: { notifiedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();
  if (!request) return;

  const today = dhakaDay();
  const due = (await nearbySubscriptions(request.district)).filter(
    (s) => s.requestPushDay !== today || s.requestPushCount < MAX_REQUEST_PUSHES_PER_DAY,
  );
  if (!due.length) return;
  // Counted before sending so two requests at once can't both slip past the cap.
  const ids = due.map((s) => s._id);
  await PushSubscription.updateMany({ _id: mongoose.trusted({ $in: ids }), requestPushDay: today }, { $inc: { requestPushCount: 1 } });
  await PushSubscription.updateMany(
    { _id: mongoose.trusted({ $in: ids }), requestPushDay: mongoose.trusted({ $ne: today }) },
    { $set: { requestPushDay: today, requestPushCount: 1 } },
  );

  const place = request.upazila ? `${request.upazila}, ${request.district}` : request.district;
  const bags = request.bagsNeeded ?? 1;
  const details = [request.hospitalAddress || place, `${bn(bags)} ব্যাগ`];
  const result = await sendPush(due, {
    title: `জরুরি ${request.requiredBloodGroup} রক্ত প্রয়োজন (${place})`,
    body: `${details.join(" · ")}। আপনি বা আপনার পরিচিত কেউ দিতে পারলে যোগাযোগ করুন।`,
    url: `/blood-requests?${new URLSearchParams({ district: request.district, bloodGroup: request.requiredBloodGroup })}`,
    tag: `request-${request._id}`,
  });
  console.log(`Blood request ${request._id}: notified ${result.sent} of ${due.length} nearby devices.`);
}

// Fire-and-forget: a failed notification must never fail the request that triggered it.
export function notifyBloodRequestLater(requestId) {
  notifyBloodRequest(requestId).catch((err) => console.error("Request notification failed:", err.message));
}
