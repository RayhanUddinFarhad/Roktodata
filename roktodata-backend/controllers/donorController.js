import { Donor } from "../models/Donor.js";
import { AppError } from "../utils/AppError.js";
import { SEARCH_PAGE_SIZE } from "../config/constants.js";
import { findDonors, visibleDonorFilter } from "../utils/findDonors.js";

// POST /api/donors/register-or-update
export async function registerOrUpdateDonor(req, res) {
  const { phoneNumber, lastDonationDate, ...details } = req.validated;

  // With phone verification on, the number confirmed by SMS code must match the profile being written.
  if (req.verifiedPhone && req.verifiedPhone !== phoneNumber) {
    throw new AppError(403, "যাচাই করা মোবাইল নাম্বারের সাথে প্রদত্ত নাম্বার মিলছে না।");
  }

  const existing = await Donor.findOne({ phoneNumber });

  if (existing) {
    if (existing.status === "Blocked") {
      throw new AppError(403, "এই প্রোফাইলটি ব্লক করা হয়েছে। বিস্তারিত জানতে Roktodatainfo@gmail.com-এ ইমেইল করুন।");
    }
    existing.set(details);
    if (lastDonationDate) existing.lastDonationDate = lastDonationDate;
    await existing.save();
    return res.json({
      success: true,
      isNew: false,
      status: existing.status,
      message:
        existing.status === "Pending"
          ? "আপনার তথ্য আপডেট করা হয়েছে। অ্যাডমিন অনুমোদনের পর প্রোফাইলটি ওয়েবসাইটে দেখা যাবে।"
          : "আপনার তথ্য সফলভাবে আপডেট করা হয়েছে।",
    });
  }

  const donor = await Donor.create({ ...details, phoneNumber, lastDonationDate: lastDonationDate ?? null });
  res.status(201).json({
    success: true,
    isNew: true,
    status: donor.status,
    message: "ধন্যবাদ! আপনার রেজিস্ট্রেশন সম্পন্ন হয়েছে। অ্যাডমিন অনুমোদনের পর আপনার প্রোফাইল ওয়েবসাইটে দেখা যাবে।",
  });
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
