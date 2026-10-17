import mongoose from "mongoose";
import { BLOOD_GROUPS, BD_PHONE_REGEX, DISTRICTS, REQUEST_STATUS } from "../config/constants.js";

const patientRequestSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true, maxlength: 100 },
    requiredBloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    district: { type: String, required: true, enum: DISTRICTS },
    upazila: { type: String, trim: true, maxlength: 60, default: "" },
    hospitalAddress: { type: String, trim: true, maxlength: 200, default: "" },
    requesterPhone: { type: String, required: true, trim: true, match: BD_PHONE_REGEX },
    bagsNeeded: { type: Number, min: 1, max: 10, default: 1 },
    neededDate: { type: Date, default: null },
    // Shown in the public feed only once an admin approves it.
    status: { type: String, enum: REQUEST_STATUS, default: "Pending" },
    // Admin's public update on the post, e.g. "রক্ত ম্যানেজ হয়েছে।"
    adminNote: { type: String, trim: true, maxlength: 300, default: "" },
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
patientRequestSchema.index({ createdAt: -1 });

export const PatientRequest = mongoose.model("PatientRequest", patientRequestSchema);
