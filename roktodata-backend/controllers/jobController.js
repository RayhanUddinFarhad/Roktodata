import { createHash, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { ELIGIBILITY_DAYS } from "../config/constants.js";
import { Donor } from "../models/Donor.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { AppError } from "../utils/AppError.js";
import { visibleDonorFilter } from "../utils/findDonors.js";
import { sendPush } from "../utils/push.js";

const DAY_MS = 24 * 60 * 60 * 1000;
// Donors who became visible again this many days back are still reminded, in case a daily run was missed.
const LOOKBACK_DAYS = 3;

// Sent to donors whose 90 days have passed (or whose chosen return date came), on the devices
// they registered or updated from with notifications allowed. No SMS is sent.
const ELIGIBLE_AGAIN = {
  title: "আপনি আবার রক্ত দিতে পারবেন",
  body: "শেষ রক্তদানের ৯০ দিন পার হয়েছে, আপনার তথ্য এখন ডোনার তালিকায় দেখা যাচ্ছে। রক্ত দিতে না চাইলে রেজিস্ট্রেশন পাতায় \"এখন প্রস্তুত নই\" দিন।",
  url: "/blood-requests",
};

// Jobs are called with "Authorization: Bearer <JOBS_SECRET>".
export function requireJobSecret(req, _res, next) {
  if (!env.JOBS_SECRET) throw new AppError(503, "Scheduled jobs are not configured.");
  const given = (req.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const hash = (value) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(hash(given), hash(env.JOBS_SECRET))) throw new AppError(401, "Unauthorized");
  next();
}

// The day a donor shows in search again: 90 days after their last donation, or their chosen return
// date if they are "not ready" and that comes later.
function visibleAgainOn(donor) {
  const eligible = donor.lastDonationDate.getTime() + ELIGIBILITY_DAYS * DAY_MS;
  return donor.isReadyToDonate ? eligible : Math.max(eligible, donor.readyAgainAt.getTime());
}

// POST /api/jobs/eligibility-reminders[?dryRun=1]
// Notifies donors who showed in search again within the last few days (90 days passed, or their
// return date came) and have a device that allows notifications. Each donation is reminded once.
export async function sendEligibilityReminders(req, res) {
  const dryRun = req.query.dryRun === "1";
  const now = Date.now();
  const from = now - LOOKBACK_DAYS * DAY_MS;
  const trusted = (op) => mongoose.trusted(op);

  // Only donors with a notification device are worth looking at.
  const withDevice = await PushSubscription.distinct("donor", { donor: trusted({ $ne: null }) });
  const candidates = await Donor.find(
    {
      ...visibleDonorFilter(),
      _id: trusted({ $in: withDevice }),
      lastDonationDate: trusted({ $ne: null, $gte: new Date(from - 400 * DAY_MS) }),
      $expr: trusted({ $ne: ["$eligibleReminderFor", "$lastDonationDate"] }),
    },
    { lastDonationDate: 1, isReadyToDonate: 1, readyAgainAt: 1 },
  ).lean();
  const due = candidates.filter((d) => {
    const on = visibleAgainOn(d);
    return on > from && on <= now;
  });

  let sent = 0;
  let failed = 0;
  if (!dryRun && due.length) {
    const devices = await PushSubscription.find({ donor: trusted({ $in: due.map((d) => d._id) }) }, { endpoint: 1, keys: 1 }).lean();
    ({ sent, failed } = await sendPush(devices, { ...ELIGIBLE_AGAIN, tag: "eligible-again" }));
    // Marked even if a device failed: the reminder is a nicety, never repeated for the same donation.
    await Promise.all(due.map((d) => Donor.updateOne({ _id: d._id }, { $set: { eligibleReminderFor: d.lastDonationDate } })));
  }
  res.json({ success: true, dryRun, due: due.length, sent, failed });
}
