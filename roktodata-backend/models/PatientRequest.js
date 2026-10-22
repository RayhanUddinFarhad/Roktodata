import mongoose from "mongoose";
import { BLOOD_GROUPS, BD_PHONE_REGEX, DISTRICTS, REQUEST_STATUS } from "../config/constants.js";

const patientRequestSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true, maxlength: 100 },
    requiredBloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    district: { type: String, required: true, enum: DISTRICTS },
    upazila: { type: String, trim: true, maxlength: 60, default: "" },
    hospitalAddress: { type: String, trim: true, maxlength: 200, default: "" },
    // Optional: the illness or reason, e.g. "রক্তশূন্যতা", "সিজারিয়ান অপারেশন".
    reason: { type: String, trim: true, maxlength: 80, default: "" },
    requesterPhone: { type: String, required: true, trim: true, match: BD_PHONE_REGEX },
    bagsNeeded: { type: Number, min: 1, max: 10, default: 1 },
    neededDate: { type: Date, default: null },
    // Shown in the public feed only once an admin approves it.
    status: { type: String, enum: REQUEST_STATUS, default: "Pending" },
    // Admin's public update on the post, e.g. "রক্ত ম্যানেজ হয়েছে।"
    adminNote: { type: String, trim: true, maxlength: 300, default: "" },
    // When nearby people were notified (once per request).
    notifiedAt: { type: Date, default: null },
    // Bangladesh calendar day ("YYYY-MM-DD") the request was made; enforces one request per number per day.
    requestDay: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Partial so that requests saved before requestDay existed (which lack it) don't block the index.
patientRequestSchema.index(
  { requesterPhone: 1, requestDay: 1 },
  { unique: true, partialFilterExpression: { requestDay: { $type: "string" } } },
);
patientRequestSchema.index({ status: 1, createdAt: -1 });
// neededDate is stored as midnight UTC of the needed day; MongoDB deletes the request once that day
// has ended in Bangladesh (UTC+6, so 18:00 UTC). Requests without a needed date never expire.
const EXPIRY_INDEX = { name: "neededDate_expiry", expireAfterSeconds: 18 * 60 * 60 };
patientRequestSchema.index({ neededDate: 1 }, EXPIRY_INDEX);
patientRequestSchema.index({ createdAt: -1 });

export const PatientRequest = mongoose.model("PatientRequest", patientRequestSchema);

// Indexes aren't built automatically in production, but auto-deletion depends on this one.
export async function ensureRequestExpiryIndex() {
  await PatientRequest.collection.createIndex({ neededDate: 1 }, EXPIRY_INDEX);
}
