import mongoose from "mongoose";
import { COMPLAINT_REASONS, FRAUD_REASONS } from "../config/constants.js";
import { Complaint } from "../models/Complaint.js";
import { Donor } from "../models/Donor.js";
import { FraudReport } from "../models/FraudReport.js";
import { AppError } from "../utils/AppError.js";

const PAGE_SIZE = 12;

// Blocked donors as fraud-list rows: the admin's block reason, plus the reason of each
// complaint against them that wasn't dismissed. Complaint details and complainant phone
// numbers stay private (they were written for the admin), so only the reason is shown.
function blockedDonorRows(match) {
  return [
    { $match: { ...match, status: "Blocked", hiddenFromFraudList: { $ne: true } } },
    {
      $lookup: {
        from: Complaint.collection.name,
        let: { donorId: "$_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$donor", "$$donorId"] }, status: { $ne: "Dismissed" } } }],
        as: "complaints",
      },
    },
    {
      $project: {
        phoneNumber: 1,
        name: "$fullName",
        report: {
          $concatArrays: [
            {
              $cond: [
                { $gt: [{ $strLenCP: { $ifNull: ["$blockReason", ""] } }, 0] },
                [
                  {
                    source: "admin",
                    reason: "blocked",
                    details: "$blockReason",
                    createdAt: { $ifNull: ["$blockedAt", "$updatedAt"] },
                  },
                ],
                [],
              ],
            },
            {
              $map: {
                input: "$complaints",
                as: "c",
                in: { source: "complaint", reason: "$$c.reason", details: "", createdAt: "$$c.createdAt" },
              },
            },
          ],
        },
        blockedDonor: { $literal: true },
      },
    },
    { $unwind: "$report" },
  ];
}

// Approved fraud reports and blocked donors, grouped per phone number: one public entry per
// fraudulent number, listing every reason. Reporter phone numbers are never included.
function groupedEntries(match) {
  return [
    { $match: { ...match, status: "Approved" } },
    {
      $project: {
        phoneNumber: 1,
        name: 1,
        report: { source: "report", reason: "$reason", details: "$details", createdAt: "$createdAt" },
        blockedDonor: { $literal: false },
      },
    },
    { $unionWith: { coll: Donor.collection.name, pipeline: blockedDonorRows(match) } },
    { $sort: { "report.createdAt": -1 } },
    {
      $group: {
        _id: "$phoneNumber",
        names: { $addToSet: "$name" },
        reports: { $push: "$report" },
        lastReportedAt: { $max: "$report.createdAt" },
        blockedDonor: { $max: "$blockedDonor" },
      },
    },
    { $sort: { lastReportedAt: -1, _id: 1 } },
  ];
}

const reasonLabel = ({ source, reason }) =>
  source === "admin"
    ? "অ্যাডমিন যাচাই করে ব্লক করেছেন"
    : source === "complaint"
      ? `অভিযোগ: ${COMPLAINT_REASONS[reason]}`
      : FRAUD_REASONS[reason];

const toPublicEntry = (entry) => ({
  phoneNumber: entry._id,
  // Some imported donors have no name.
  names: entry.names.filter(Boolean),
  reportCount: entry.reports.length,
  lastReportedAt: entry.lastReportedAt.toISOString(),
  // Whether the number belongs to a registered donor the admin has blocked.
  blockedDonor: entry.blockedDonor,
  reports: entry.reports.map((report) => ({
    source: report.source,
    reason: report.reason,
    reasonLabel: reasonLabel(report),
    details: report.details,
    createdAt: report.createdAt.toISOString(),
  })),
});

// POST /api/fraud-reports
export async function createFraudReport(req, res) {
  const report = req.validated;

  // One active report per reporter per number (a rejected one may be re-submitted).
  const duplicate = await FraudReport.exists({
    phoneNumber: report.phoneNumber,
    reporterPhone: report.reporterPhone,
    status: mongoose.trusted({ $in: ["Pending", "Approved"] }),
  });
  if (duplicate) {
    throw new AppError(409, "আপনি ইতিমধ্যে এই নাম্বারের বিরুদ্ধে রিপোর্ট করেছেন। অ্যাডমিন বিষয়টি দেখছেন।");
  }

  await FraudReport.create(report);
  res.status(201).json({
    success: true,
    message: "আপনার রিপোর্ট জমা হয়েছে। অ্যাডমিন যাচাই করে সঠিক মনে করলে নাম্বারটি প্রতারক তালিকায় যোগ করা হবে।",
  });
}

// GET /api/fraud-reports?page=
export async function listFraudEntries(req, res) {
  const { page } = req.validated;
  const [result] = await FraudReport.aggregate([
    ...groupedEntries({}),
    {
      $facet: {
        entries: [{ $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }],
        total: [{ $count: "count" }],
      },
    },
  ]);
  const total = result.total[0]?.count ?? 0;

  res.json({
    success: true,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    entries: result.entries.map(toPublicEntry),
  });
}

// GET /api/fraud-reports/check?phone=
export async function checkFraudNumber(req, res) {
  const { phone } = req.validated;
  const [entry] = await FraudReport.aggregate(groupedEntries({ phoneNumber: phone }));
  res.json({ success: true, phoneNumber: phone, isFraud: !!entry, entry: entry ? toPublicEntry(entry) : null });
}
