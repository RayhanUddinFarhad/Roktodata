import { createHash, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { ELIGIBILITY_DAYS } from "../config/constants.js";
import { Donor } from "../models/Donor.js";
import { AppError } from "../utils/AppError.js";
import { visibleDonorFilter } from "../utils/findDonors.js";
import { sendSms } from "../utils/sms.js";

const DAY_MS = 24 * 60 * 60 * 1000;
// Donors who became visible again this many days back are still reminded, in case a daily run was missed.
const LOOKBACK_DAYS = 3;
// At most this many SMS per run, to cap the cost if something goes wrong.
const MAX_PER_RUN = 300;

export const ELIGIBLE_AGAIN_SMS =
  'রক্তদাতা থেকে বলছি, আমাদের ওয়েবসাইটে দেওয়া তথ্যে শেষ রক্তদানের তারিখ অনুযায়ী আপনি এখন রক্ত দিতে প্রস্তুত এবং আপনার তথ্য এখন সাইটে দেখা যাবে। সাইটে না দেখাতে রেজিস্ট্রেশন পেজে গিয়ে "এখন প্রস্তুত নই" দিন: roktodata.org/register';

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
// Texts donors who registered on the website, gave a last donation date, and showed in search again
// within the last few days (90 days passed, or their return date came). Each donation is reminded once.
export async function sendEligibilityReminders(req, res) {
  const dryRun = req.query.dryRun === "1";
  const now = Date.now();
  const from = now - LOOKBACK_DAYS * DAY_MS;
  const trusted = (op) => mongoose.trusted(op);

  const candidates = await Donor.find(
    {
      ...visibleDonorFilter(),
      source: "website",
      lastDonationDate: trusted({ $ne: null, $gte: new Date(from - 400 * DAY_MS) }),
      $expr: trusted({ $ne: ["$eligibleReminderFor", "$lastDonationDate"] }),
    },
    { phoneNumber: 1, lastDonationDate: 1, isReadyToDonate: 1, readyAgainAt: 1 },
  ).lean();
  const due = candidates.filter((d) => {
    const on = visibleAgainOn(d);
    return on > from && on <= now;
  });

  let sent = 0;
  let failed = 0;
  if (!dryRun) {
    for (const donor of due.slice(0, MAX_PER_RUN)) {
      try {
        await sendSms(donor.phoneNumber, ELIGIBLE_AGAIN_SMS);
        await Donor.updateOne({ _id: donor._id }, { $set: { eligibleReminderFor: donor.lastDonationDate } });
        sent++;
      } catch (err) {
        failed++;
        console.error(`Eligibility SMS failed for donor ${donor._id}: ${err.message}`);
      }
    }
  }
  res.json({ success: true, dryRun, due: due.length, sent, failed });
}
