import { Complaint } from "../models/Complaint.js";
import { Donor } from "../models/Donor.js";
import { AppError } from "../utils/AppError.js";

// POST /api/complaints
export async function createComplaint(req, res) {
  const { donorId, complainantPhone, reason, details } = req.validated;

  const donor = await Donor.exists({ _id: donorId, status: "Active" });
  if (!donor) throw new AppError(404, "এই ডোনারকে খুঁজে পাওয়া যায়নি।");

  const duplicate = await Complaint.exists({ donor: donorId, complainantPhone, status: "Open" });
  if (duplicate) {
    throw new AppError(409, "আপনি ইতিমধ্যে এই ডোনারের বিরুদ্ধে অভিযোগ করেছেন। অ্যাডমিন বিষয়টি দেখছেন।");
  }

  await Complaint.create({ donor: donorId, complainantPhone, reason, details });
  res.status(201).json({
    success: true,
    message: "আপনার অভিযোগ জমা হয়েছে। অ্যাডমিন বিষয়টি যাচাই করে ব্যবস্থা নেবেন।",
  });
}
