import mongoose from "mongoose";
import { BD_PHONE_REGEX, FRAUD_REASONS, FRAUD_STATUS } from "../config/constants.js";

// A user's report that a phone number belongs to a fraudulent "donor". Only admin-approved
// reports are public; the reporter's phone number is never shown publicly.
const fraudReportSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, trim: true, match: BD_PHONE_REGEX },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    reason: { type: String, required: true, enum: Object.keys(FRAUD_REASONS) },
    details: { type: String, required: true, trim: true, maxlength: 1000 },
    reporterPhone: { type: String, required: true, trim: true, match: BD_PHONE_REGEX },
    status: { type: String, enum: FRAUD_STATUS, default: "Pending" },
  },
  { timestamps: true },
);

// Public list and number lookups (approved reports by number), admin list by status,
// and duplicate checks per reporter.
fraudReportSchema.index({ status: 1, phoneNumber: 1 });
fraudReportSchema.index({ status: 1, createdAt: -1 });
fraudReportSchema.index({ phoneNumber: 1, reporterPhone: 1 });

export const FraudReport = mongoose.model("FraudReport", fraudReportSchema);
