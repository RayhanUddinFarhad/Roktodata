import mongoose from "mongoose";
import { FRAUD_REASONS } from "../config/constants.js";
import { FraudReport } from "../models/FraudReport.js";
import { AppError } from "../utils/AppError.js";

const PAGE_SIZE = 12;

// Approved reports grouped per phone number: one public entry per fraudulent number,
// listing every approved reason. Reporter phone numbers are never included.
function groupedEntries(match) {
  return [
    { $match: { ...match, status: "Approved" } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$phoneNumber",
        names: { $addToSet: "$name" },
        reports: { $push: { reason: "$reason", details: "$details", createdAt: "$createdAt" } },
        lastReportedAt: { $max: "$createdAt" },
      },
    },
    { $sort: { lastReportedAt: -1, _id: 1 } },
  ];
}

const toPublicEntry = (entry) => ({
  phoneNumber: entry._id,
  names: entry.names,
  reportCount: entry.reports.length,
  lastReportedAt: entry.lastReportedAt.toISOString(),
  reports: entry.reports.map((report) => ({
    reason: report.reason,
    reasonLabel: FRAUD_REASONS[report.reason],
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
