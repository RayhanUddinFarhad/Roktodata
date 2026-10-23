import { Donor } from "../models/Donor.js";
import { PushSubscription } from "../models/PushSubscription.js";
import { AppError } from "../utils/AppError.js";
import { toBanglaName } from "../utils/banglaName.js";
import { ELIGIBILITY_DAYS, SEARCH_PAGE_SIZE } from "../config/constants.js";
import { findDonors, visibleDonorFilter } from "../utils/findDonors.js";

// When a "not ready" donor is ready again: 1/3/6 months from now, "eligible" = ELIGIBILITY_DAYS after
// their last donation, or "eligible120" = 120 days after it (the longer gap often advised for women).
// Null when ready, with no end chosen, or a day count without a last donation date.
const AFTER_DONATION_DAYS = { eligible: ELIGIBILITY_DAYS, eligible120: 120 };
function readyAgainDate(isReady, choice, lastDonationDate) {
  if (isReady || !choice) return null;
  if (choice in AFTER_DONATION_DAYS) {
    return lastDonationDate ? new Date(lastDonationDate.getTime() + AFTER_DONATION_DAYS[choice] * 24 * 60 * 60 * 1000) : null;
  }
  const date = new Date();
  date.setMonth(date.getMonth() + choice);
  return date;
}

// The device the donor saved from, if it allows notifications, gets their "you can donate again"
// reminder. The phone number was verified by SMS, so the link can be trusted.
async function linkDevice(endpoint, donorId) {
  if (endpoint) await PushSubscription.updateOne({ endpoint }, { $set: { donor: donorId } });
}

// POST /api/donors/register-or-update
export async function registerOrUpdateDonor(req, res) {
  const { phoneNumber, lastDonationDate, readyAgain, pushEndpoint, ...rest } = req.validated;
  // Names are shown in Bangla on the site; English input is converted.
  const details = { ...rest, fullName: toBanglaName(rest.fullName) };

  // With phone verification on, the number confirmed by SMS code must match the profile being written.
  if (req.verifiedPhone && req.verifiedPhone !== phoneNumber) {
    throw new AppError(403, "যাচাই করা মোবাইল নাম্বারের সাথে প্রদত্ত নাম্বার মিলছে না।");
  }

  const existing = await Donor.findOne({ phoneNumber });

  if (existing) {
    if (existing.status === "Blocked") {
      throw new AppError(403, "এই প্রোফাইলটি ব্লক করা হয়েছে। বিস্তারিত জানতে Roktodatainfo@gmail.com-এ ইমেইল করুন।");
    }
    // Switching to "not ready" starts the hidden period; staying not ready keeps its start.
    const notReadySince = details.isReadyToDonate ? null : existing.isReadyToDonate || !existing.notReadySince ? new Date() : existing.notReadySince;
    existing.set({ ...details, notReadySince });
    if (lastDonationDate) existing.lastDonationDate = lastDonationDate;
    existing.readyAgainAt = readyAgainDate(details.isReadyToDonate, readyAgain, existing.lastDonationDate);
    await existing.save();
    await linkDevice(pushEndpoint, existing._id);
    return res.json({
      success: true,
      isNew: false,
      fullName: existing.fullName,
      status: existing.status,
      message:
        existing.status === "Pending"
          ? "আপনার তথ্য আপডেট করা হয়েছে। অ্যাডমিন অনুমোদনের পর প্রোফাইলটি ওয়েবসাইটে দেখা যাবে।"
          : "আপনার তথ্য সফলভাবে আপডেট করা হয়েছে।",
    });
  }

  const donor = await Donor.create({
    ...details,
    phoneNumber,
    lastDonationDate: lastDonationDate ?? null,
    readyAgainAt: readyAgainDate(details.isReadyToDonate, readyAgain, lastDonationDate),
    notReadySince: details.isReadyToDonate ? null : new Date(),
  });
  await linkDevice(pushEndpoint, donor._id);
  res.status(201).json({
    success: true,
    isNew: true,
    fullName: donor.fullName,
    status: donor.status,
    message: "ধন্যবাদ! আপনার রেজিস্ট্রেশন সম্পন্ন হয়েছে। অ্যাডমিন অনুমোদনের পর আপনার প্রোফাইল ওয়েবসাইটে দেখা যাবে।",
  });
}

// GET /api/donors/name-preview?name= — how a name will be saved and shown (English -> Bangla).
export function previewName(req, res) {
  res.json({ success: true, fullName: toBanglaName(req.validated.name) });
}

// GET /api/donors/search
export async function searchDonors(req, res) {
  const { page, ...filters } = req.validated;
  const { donors, total } = await findDonors({ ...filters, page, limit: SEARCH_PAGE_SIZE });
  res.json({
    success: true,
    count: total,
    total,
    page,
    pageSize: SEARCH_PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)),
    donors,
  });
}

// GET /api/donors/stats — counts of visible donors per district and blood group, for the
// public district pages. No personal data.
export async function donorStats(_req, res) {
  const rows = await Donor.aggregate([
    { $match: visibleDonorFilter() },
    { $group: { _id: { district: "$district", bloodGroup: "$bloodGroup" }, count: { $sum: 1 } } },
  ]);
  const byDistrict = {};
  let total = 0;
  for (const { _id, count } of rows) {
    const entry = (byDistrict[_id.district] ??= { total: 0, groups: {} });
    entry.groups[_id.bloodGroup] = count;
    entry.total += count;
    total += count;
  }
  // Counts change slowly; let browsers and the frontend cache them for a while.
  res.set("Cache-Control", "public, max-age=600");
  res.json({ success: true, total, byDistrict });
}
