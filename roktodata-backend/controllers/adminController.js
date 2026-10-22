import { createHash, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { COMPLAINT_REASONS, FRAUD_REASONS } from "../config/constants.js";
import { Complaint } from "../models/Complaint.js";
import { Donor } from "../models/Donor.js";
import { DonorContact } from "../models/DonorContact.js";
import { FraudReport } from "../models/FraudReport.js";
import { PatientRequest } from "../models/PatientRequest.js";
import { photoCardsMade } from "./photocardController.js";
import { AppError } from "../utils/AppError.js";
import { dhakaDay } from "../utils/dhakaDate.js";
import { escapeRegex } from "../utils/findDonors.js";
import { toPublicRequest } from "./patientController.js";

const PAGE_SIZE = 20;

// Constant-time comparison that does not leak the length of the secret.
function safeEqual(a, b) {
  const hash = (value) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(a), hash(b));
}

const toDate = (date) => (date ? date.toISOString().slice(0, 10) : null);

// POST /api/admin/login
export async function login(req, res) {
  const { username, password } = req.validated;
  const valid = safeEqual(username, env.ADMIN_USERNAME) & safeEqual(password, env.ADMIN_PASSWORD);
  if (!valid) throw new AppError(401, "ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।");

  const token = jwt.sign({ role: "admin" }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN,
    subject: env.ADMIN_USERNAME,
  });
  res.json({ success: true, token, message: "সফলভাবে লগইন হয়েছে।" });
}

// Call / WhatsApp taps today (Bangladesh time), in the last 7 days and in total, with how many
// different donors were contacted.
async function contactSummary() {
  const today = new Date(`${dhakaDay()}T00:00:00+06:00`);
  const week = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  const bucket = (from) => [
    ...(from ? [{ $match: { createdAt: { $gte: from } } }] : []),
    {
      $group: {
        _id: null,
        call: { $sum: { $cond: [{ $eq: ["$type", "call"] }, 1, 0] } },
        whatsapp: { $sum: { $cond: [{ $eq: ["$type", "whatsapp"] }, 1, 0] } },
        donors: { $addToSet: "$donor" },
      },
    },
    { $project: { _id: 0, call: 1, whatsapp: 1, donors: { $size: "$donors" } } },
  ];
  const [result] = await DonorContact.aggregate([{ $facet: { today: bucket(today), week: bucket(week), total: bucket() } }]);
  const pick = (rows) => rows[0] ?? { call: 0, whatsapp: 0, donors: 0 };
  return { today: pick(result.today), week: pick(result.week), total: pick(result.total) };
}

// GET /api/admin/stats
export async function getStats(_req, res) {
  const [byStatus, openComplaints, pendingRequests, pendingFraudReports, photoCards, contacts, hiddenDonors] = await Promise.all([
    Donor.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Complaint.countDocuments({ status: "Open" }),
    PatientRequest.countDocuments({ status: "Pending" }),
    FraudReport.countDocuments({ status: "Pending" }),
    photoCardsMade(),
    contactSummary(),
    // approved donors who chose "not ready" and haven't reached their return date
    Donor.countDocuments({
      status: "Active",
      isReadyToDonate: false,
      $or: [{ readyAgainAt: null }, { readyAgainAt: mongoose.trusted({ $gt: new Date() }) }],
    }),
  ]);
  const count = (status) => byStatus.find((row) => row._id === status)?.count ?? 0;

  res.json({
    success: true,
    stats: {
      pending: count("Pending"),
      active: count("Active"),
      blocked: count("Blocked"),
      openComplaints,
      pendingRequests,
      pendingFraudReports,
      photoCards,
      contacts,
      hiddenDonors,
    },
  });
}

// GET /api/admin/donors?status=&q=&page=
export async function listDonors(req, res) {
  const { status, q, page, sort, ready, order } = req.validated;

  const filter = {};
  if (status) filter.status = status;
  if (ready === "hidden") filter.isReadyToDonate = false;
  if (q) {
    // Digits search the phone number by prefix; anything else searches the name.
    filter.$or = /^\d+$/.test(q)
      ? [{ phoneNumber: mongoose.trusted({ $regex: `^${q}` }) }]
      : [{ fullName: mongoose.trusted({ $regex: escapeRegex(q), $options: "i" }) }];
  }

  const [donors, total] = await Promise.all([
    Donor.find(filter)
      .sort(
        sort === "contacts"
          ? { "contacts.total": -1, lastContactedAt: -1 }
          : ready === "hidden"
            ? order === "oldest"
              ? { notReadySince: 1, _id: 1 }
              : { notReadySince: -1, _id: -1 }
            : { createdAt: -1 },
      )
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Donor.countDocuments(filter),
  ]);

  const complaintCounts = await Complaint.aggregate([
    { $match: { donor: { $in: donors.map((donor) => donor._id) }, status: "Open" } },
    { $group: { _id: "$donor", count: { $sum: 1 } } },
  ]);
  const openComplaintsFor = (id) => complaintCounts.find((row) => row._id.equals(id))?.count ?? 0;

  res.json({
    success: true,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    donors: donors.map((donor) => ({
      id: donor._id.toString(),
      fullName: donor.fullName,
      phoneNumber: donor.phoneNumber,
      bloodGroup: donor.bloodGroup,
      district: donor.district,
      upazila: donor.upazila,
      lastDonationDate: toDate(donor.lastDonationDate),
      isReadyToDonate: donor.isReadyToDonate,
      readyAgainAt: toDate(donor.readyAgainAt),
      notReadySince: toDate(donor.notReadySince),
      contacts: { call: donor.contacts?.call ?? 0, whatsapp: donor.contacts?.whatsapp ?? 0 },
      lastContactedAt: donor.lastContactedAt ? donor.lastContactedAt.toISOString() : null,
      status: donor.status,
      blockReason: donor.blockReason ?? "",
      // Blocked donors are listed publicly as fraudulent unless the admin hid them.
      inFraudList: donor.status === "Blocked" && !donor.hiddenFromFraudList,
      createdAt: donor.createdAt.toISOString(),
      openComplaints: openComplaintsFor(donor._id),
    })),
  });
}

// PATCH /api/admin/donors/:id/status
export async function updateDonorStatus(req, res) {
  const { id, status, reason } = req.validated;
  // A newly blocked donor is listed in the public fraud list until the admin removes them from it.
  const update =
    status === "Blocked"
      ? { status, blockReason: reason, blockedAt: new Date(), hiddenFromFraudList: false }
      : { status, blockReason: "", blockedAt: null, hiddenFromFraudList: false };
  const donor = await Donor.findByIdAndUpdate(id, update, { returnDocument: "after" });
  if (!donor) throw new AppError(404, "ডোনার পাওয়া যায়নি।");

  const messages = {
    Active: "ডোনার অনুমোদন করা হয়েছে। এখন ওয়েবসাইটে দেখা যাবে।",
    Blocked: "ডোনার ব্লক করা হয়েছে এবং কারণসহ প্রতারক তালিকায় যোগ করা হয়েছে।",
    Pending: "ডোনারকে অপেক্ষমাণ তালিকায় রাখা হয়েছে।",
  };
  res.json({ success: true, status: donor.status, message: messages[donor.status] });
}

// PATCH /api/admin/donors/:id/fraud-list  { listed: boolean }
// Shows or hides a blocked donor in the public fraud list; the donor stays blocked either way.
export async function setDonorFraudListing(req, res) {
  const { id, listed } = req.validated;
  const donor = await Donor.findById(id);
  if (!donor) throw new AppError(404, "ডোনার পাওয়া যায়নি।");
  if (donor.status !== "Blocked") {
    throw new AppError(400, "শুধু ব্লক করা ডোনারকে প্রতারক তালিকায় দেখানো বা সরানো যায়।");
  }
  donor.hiddenFromFraudList = !listed;
  await donor.save();
  res.json({
    success: true,
    listed,
    message: listed
      ? "ডোনারকে আবার প্রতারক তালিকায় দেখানো হচ্ছে।"
      : "ডোনারকে প্রতারক তালিকা থেকে সরানো হয়েছে। তিনি ব্লক অবস্থাতেই আছেন।",
  });
}

// DELETE /api/admin/donors/:id (reject a registration or remove a donor)
export async function deleteDonor(req, res) {
  const { id } = req.validated;
  const donor = await Donor.findByIdAndDelete(id);
  if (!donor) throw new AppError(404, "ডোনার পাওয়া যায়নি।");
  await Complaint.deleteMany({ donor: donor._id });
  res.json({ success: true, message: "ডোনারের তথ্য মুছে ফেলা হয়েছে।" });
}

// GET /api/admin/complaints?status=&page=
export async function listComplaints(req, res) {
  const { status, page } = req.validated;
  const filter = status ? { status } : {};

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("donor", "fullName phoneNumber bloodGroup district upazila status")
      .lean(),
    Complaint.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    complaints: complaints.map((complaint) => ({
      id: complaint._id.toString(),
      complainantPhone: complaint.complainantPhone,
      reason: complaint.reason,
      reasonLabel: COMPLAINT_REASONS[complaint.reason],
      details: complaint.details,
      status: complaint.status,
      createdAt: complaint.createdAt.toISOString(),
      // null if the donor has since been deleted
      donor: complaint.donor && {
        id: complaint.donor._id.toString(),
        fullName: complaint.donor.fullName,
        phoneNumber: complaint.donor.phoneNumber,
        bloodGroup: complaint.donor.bloodGroup,
        district: complaint.donor.district,
        upazila: complaint.donor.upazila,
        status: complaint.donor.status,
      },
    })),
  });
}

// PATCH /api/admin/complaints/:id/status
export async function updateComplaintStatus(req, res) {
  const { id, status } = req.validated;
  const complaint = await Complaint.findByIdAndUpdate(id, { status }, { returnDocument: "after" });
  if (!complaint) throw new AppError(404, "অভিযোগ পাওয়া যায়নি।");

  const messages = {
    Resolved: "অভিযোগটি সমাধান হিসেবে চিহ্নিত করা হয়েছে।",
    Dismissed: "অভিযোগটি বাতিল করা হয়েছে।",
    Open: "অভিযোগটি আবার খোলা হয়েছে।",
  };
  res.json({ success: true, status: complaint.status, message: messages[complaint.status] });
}

// GET /api/admin/requests?status=&page=
export async function listRequests(req, res) {
  const { status, page } = req.validated;
  const filter = status ? { status } : {};

  const [requests, total] = await Promise.all([
    PatientRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    PatientRequest.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    requests: requests.map(toPublicRequest),
  });
}

// PATCH /api/admin/requests/:id/status
export async function updateRequestStatus(req, res) {
  const { id, status, note } = req.validated;
  const update = note === undefined ? { status } : { status, adminNote: note };
  const request = await PatientRequest.findByIdAndUpdate(id, update, { returnDocument: "after" });
  if (!request) throw new AppError(404, "অনুরোধ পাওয়া যায়নি।");

  const messages = {
    Approved: "অনুরোধটি অনুমোদিত হয়েছে এবং \"রক্তের অনুরোধ\" পাতায় পোস্ট করা হয়েছে।",
    Rejected: "অনুরোধটি বাতিল করা হয়েছে।",
    Fulfilled: "অনুরোধটি \"রক্ত পাওয়া গেছে\" হিসেবে চিহ্নিত করা হয়েছে।",
    Pending: "অনুরোধটি আবার অপেক্ষমাণ তালিকায় রাখা হয়েছে।",
  };
  res.json({ success: true, status: request.status, message: messages[request.status] });
}

// PATCH /api/admin/requests/:id/note (shown on the public post; empty clears it)
export async function updateRequestNote(req, res) {
  const { id, note } = req.validated;
  const request = await PatientRequest.findByIdAndUpdate(id, { adminNote: note }, { returnDocument: "after" });
  if (!request) throw new AppError(404, "অনুরোধ পাওয়া যায়নি।");
  res.json({
    success: true,
    adminNote: request.adminNote,
    message: request.adminNote ? "নোট সংরক্ষণ করা হয়েছে।" : "নোট মুছে ফেলা হয়েছে।",
  });
}

// DELETE /api/admin/requests/:id
export async function deleteRequest(req, res) {
  const { id } = req.validated;
  const request = await PatientRequest.findByIdAndDelete(id);
  if (!request) throw new AppError(404, "অনুরোধ পাওয়া যায়নি।");
  res.json({ success: true, message: "অনুরোধটি মুছে ফেলা হয়েছে।" });
}

// GET /api/admin/fraud-reports?status=&page=
// Each report includes the registered donor with that phone number, if any, so the admin can block them.
export async function listFraudReports(req, res) {
  const { status, page } = req.validated;
  const filter = status ? { status } : {};

  const [reports, total] = await Promise.all([
    FraudReport.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    FraudReport.countDocuments(filter),
  ]);

  const phones = [...new Set(reports.map((report) => report.phoneNumber))];
  const [donors, approvedCounts] = await Promise.all([
    Donor.find({ phoneNumber: mongoose.trusted({ $in: phones }) }, "fullName phoneNumber status bloodGroup").lean(),
    FraudReport.aggregate([
      { $match: { phoneNumber: { $in: phones }, status: "Approved" } },
      { $group: { _id: "$phoneNumber", count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    reports: reports.map((report) => {
      const donor = donors.find((d) => d.phoneNumber === report.phoneNumber);
      return {
        id: report._id.toString(),
        phoneNumber: report.phoneNumber,
        name: report.name,
        reason: report.reason,
        reasonLabel: FRAUD_REASONS[report.reason],
        details: report.details,
        reporterPhone: report.reporterPhone,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        approvedReportsForNumber: approvedCounts.find((row) => row._id === report.phoneNumber)?.count ?? 0,
        donor: donor && {
          id: donor._id.toString(),
          fullName: donor.fullName,
          bloodGroup: donor.bloodGroup,
          status: donor.status,
        },
      };
    }),
  });
}

// PATCH /api/admin/fraud-reports/:id/status
export async function updateFraudReportStatus(req, res) {
  const { id, status } = req.validated;
  const report = await FraudReport.findByIdAndUpdate(id, { status }, { returnDocument: "after" });
  if (!report) throw new AppError(404, "রিপোর্ট পাওয়া যায়নি।");

  const messages = {
    Approved: "রিপোর্টটি অনুমোদিত হয়েছে। নাম্বারটি প্রতারক তালিকায় দেখানো হচ্ছে।",
    Rejected: "রিপোর্টটি বাতিল করা হয়েছে।",
    Pending: "রিপোর্টটি আবার অপেক্ষমাণ তালিকায় রাখা হয়েছে।",
  };
  res.json({ success: true, status: report.status, message: messages[report.status] });
}

// DELETE /api/admin/fraud-reports/:id
export async function deleteFraudReport(req, res) {
  const { id } = req.validated;
  const report = await FraudReport.findByIdAndDelete(id);
  if (!report) throw new AppError(404, "রিপোর্ট পাওয়া যায়নি।");
  res.json({ success: true, message: "রিপোর্টটি মুছে ফেলা হয়েছে।" });
}
