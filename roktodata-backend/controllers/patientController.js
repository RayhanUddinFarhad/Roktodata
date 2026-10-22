import mongoose from "mongoose";
import { MAX_SEARCH_RESULTS, REQUEST_FEED_DAYS } from "../config/constants.js";
import { Donor } from "../models/Donor.js";
import { FraudReport } from "../models/FraudReport.js";
import { PatientRequest } from "../models/PatientRequest.js";
import { AppError } from "../utils/AppError.js";
import { verifyPhoneToken } from "../utils/phoneToken.js";
import { notifyBloodRequestLater } from "../utils/push.js";
import { dhakaDay } from "../utils/dhakaDate.js";
import { findDonors } from "../utils/findDonors.js";

const FEED_PAGE_SIZE = 12;

const duplicateRequest = () =>
  new AppError(
    409,
    "আপনি আজ এই নাম্বার দিয়ে ইতিমধ্যে একটি অনুরোধ করেছেন এবং সেটি পোস্ট করার জন্য জমা আছে। একই নাম্বার থেকে দিনে একবারই অনুরোধ করা যায়। চাইলে \"ডোনার খুঁজুন\" পাতায় গিয়ে কাঙ্ক্ষিত ডোনারদের সাথে সরাসরি যোগাযোগ করতে পারেন।",
    "DUPLICATE_REQUEST",
  );

// A request goes live without admin review when the requester proved the phone number by SMS
// code, named the hospital, and the number is not on the fraud list or a blocked profile.
async function canPublishDirectly(req, request) {
  const [scheme, token] = (req.get("authorization") ?? "").split(" ");
  const verifiedPhone = scheme === "Bearer" && token ? verifyPhoneToken(token) : null;
  if (verifiedPhone !== request.requesterPhone || (request.hospitalAddress ?? "").length < 3) return false;
  const [fraud, blocked] = await Promise.all([
    FraudReport.exists({ phoneNumber: request.requesterPhone, status: "Approved" }),
    Donor.exists({ phoneNumber: request.requesterPhone, status: "Blocked" }),
  ]);
  return !fraud && !blocked;
}

// POST /api/patient/search-and-log
// Saves the request (one per phone number per Bangladesh day) and returns donors in the same
// upazila, plus other donors in the same district. Verified requests are published and announced
// to people nearby straight away; the rest wait for admin review.
export async function searchAndLog(req, res) {
  const { neededDate, ...request } = req.validated;
  const requestDay = dhakaDay();

  if (await PatientRequest.exists({ requesterPhone: request.requesterPhone, requestDay })) {
    throw duplicateRequest();
  }
  const published = await canPublishDirectly(req, request);
  let saved;
  try {
    saved = await PatientRequest.create({
      ...request,
      neededDate: neededDate ?? null,
      requestDay,
      status: published ? "Approved" : "Pending",
    });
  } catch (err) {
    // Two simultaneous submissions: the unique index lets only one through.
    if (err.code === 11000) throw duplicateRequest();
    throw err;
  }
  if (published) notifyBloodRequestLater(saved._id);

  // The first MAX_SEARCH_RESULTS of each list; the totals tell the page when there are more.
  const filters = { bloodGroup: request.requiredBloodGroup, district: request.district, limit: MAX_SEARCH_RESULTS };
  const none = { donors: [], total: 0 };
  const [local, nearby] = await Promise.all([
    findDonors({ ...filters, upazila: request.upazila }),
    request.upazila ? findDonors({ ...filters, excludeUpazila: request.upazila }) : none,
  ]);

  res.status(201).json({
    success: true,
    message: "আপনার অনুরোধটি আমরা পেয়েছি।",
    published,
    id: saved._id.toString(),
    count: local.total,
    total: local.total,
    donors: local.donors,
    nearbyTotal: nearby.total,
    nearbyDonors: nearby.donors,
  });
}

const toPublicRequest = (request) => ({
  id: request._id.toString(),
  patientName: request.patientName,
  requiredBloodGroup: request.requiredBloodGroup,
  district: request.district,
  upazila: request.upazila,
  hospitalAddress: request.hospitalAddress,
  reason: request.reason ?? "",
  requesterPhone: request.requesterPhone,
  bagsNeeded: request.bagsNeeded ?? 1,
  neededDate: request.neededDate ? request.neededDate.toISOString().slice(0, 10) : null,
  status: request.status,
  adminNote: request.adminNote ?? "",
  createdAt: request.createdAt.toISOString(),
});

// GET /api/patient/requests?bloodGroup=&district=&page=
// Public feed of admin-approved requests (and fulfilled ones, marked as such) from the last REQUEST_FEED_DAYS days.
export async function listPublicRequests(req, res) {
  const { bloodGroup, district, page } = req.validated;
  const since = new Date(Date.now() - REQUEST_FEED_DAYS * 24 * 60 * 60 * 1000);

  // Operators built here (not from user input) are marked trusted so sanitizeFilter keeps them.
  const filter = {
    status: mongoose.trusted({ $in: ["Approved", "Fulfilled"] }),
    createdAt: mongoose.trusted({ $gte: since }),
  };
  if (bloodGroup) filter.requiredBloodGroup = bloodGroup;
  if (district) filter.district = district;

  const [requests, total] = await Promise.all([
    PatientRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * FEED_PAGE_SIZE)
      .limit(FEED_PAGE_SIZE)
      .lean(),
    PatientRequest.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / FEED_PAGE_SIZE)),
    requests: requests.map(toPublicRequest),
  });
}

export { toPublicRequest };
