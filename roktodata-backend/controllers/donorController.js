import { Donor } from "../models/Donor.js";
import { AppError } from "../utils/AppError.js";
import { findDonors } from "../utils/findDonors.js";

// POST /api/donors/register-or-update
export async function registerOrUpdateDonor(req, res) {
  const { phoneNumber, lastDonationDate, ...details } = req.validated;

  // With phone verification on, the verified Firebase phone number must match the profile being written.
  if (req.user && req.user.phone_number !== `+88${phoneNumber}`) {
    throw new AppError(403, "যাচাই করা মোবাইল নাম্বারের সাথে প্রদত্ত নাম্বার মিলছে না।");
  }

  const existing = await Donor.findOne({ phoneNumber });

  if (existing) {
    if (existing.status === "Blocked") {
      throw new AppError(403, "এই প্রোফাইলটি ব্লক করা হয়েছে। অনুগ্রহ করে হটলাইনে যোগাযোগ করুন।");
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
  const donors = await findDonors(req.validated);
  res.json({ success: true, count: donors.length, donors });
}
