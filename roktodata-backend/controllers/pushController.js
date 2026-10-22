import { env } from "../config/env.js";
import { DISTRICT_COORDS, nearestDistrict } from "../config/districtCoords.js";
import { Donor } from "../models/Donor.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { AppError } from "../utils/AppError.js";
import { verifyPhoneToken } from "../utils/phoneToken.js";
import { pushEnabled } from "../utils/push.js";

// GET /api/push/key: the public key browsers need to subscribe.
export function pushKey(_req, res) {
  if (!pushEnabled) throw new AppError(503, "Notifications are not configured.");
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ success: true, publicKey: env.VAPID_PUBLIC_KEY });
}

// POST /api/push/subscribe: saves (or refreshes) a device. Called when notifications are allowed
// and again whenever the site or app is opened, with the visitor's approximate location from
// their IP address. A district the visitor picked themselves wins over the IP location.
export async function subscribe(req, res) {
  const { subscription, lat, lng, district } = req.validated;
  const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint }, { district: 1, districtChosen: 1 }).lean();

  const update = { keys: subscription.keys, lastSeenAt: new Date() };
  if (district) {
    Object.assign(update, { district, districtChosen: true, lat: DISTRICT_COORDS[district][0], lng: DISTRICT_COORDS[district][1] });
  } else if (!existing?.districtChosen && lat != null && lng != null) {
    Object.assign(update, { lat, lng, district: nearestDistrict([lat, lng]) });
  }

  const saved = await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { $set: update },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
  res.json({ success: true, district: saved.district, districtChosen: saved.districtChosen });
}

// POST /api/push/unsubscribe
export async function unsubscribe(req, res) {
  await PushSubscription.deleteOne({ endpoint: req.validated.endpoint });
  res.json({ success: true });
}

// POST /api/push/link: a donor who turned notifications on right after registering or updating
// links this device to their profile, proving the number with the token from the SMS code.
export async function linkDonor(req, res) {
  const [scheme, token] = (req.get("authorization") ?? "").split(" ");
  const phone = scheme === "Bearer" && token ? verifyPhoneToken(token) : null;
  if (!phone) throw new AppError(401, "মোবাইল নাম্বার যাচাইয়ের মেয়াদ শেষ হয়েছে।", "PHONE_NOT_VERIFIED");
  const donor = await Donor.findOne({ phoneNumber: phone }, { _id: 1 }).lean();
  if (!donor) throw new AppError(404, "ডোনার পাওয়া যায়নি।");
  await PushSubscription.updateOne({ endpoint: req.validated.endpoint }, { $set: { donor: donor._id } });
  res.json({ success: true });
}
