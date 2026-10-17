import mongoose from "mongoose";
import { BD_PHONE_REGEX, COMPLAINT_REASONS, COMPLAINT_STATUS } from "../config/constants.js";

const complaintSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
    complainantPhone: { type: String, required: true, trim: true, match: BD_PHONE_REGEX },
    reason: { type: String, required: true, enum: Object.keys(COMPLAINT_REASONS) },
    details: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: COMPLAINT_STATUS, default: "Open" },
  },
  { timestamps: true },
);

// Admin list of complaints by status, and duplicate checks per donor.
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ donor: 1, complainantPhone: 1, status: 1 });

export const Complaint = mongoose.model("Complaint", complaintSchema);
