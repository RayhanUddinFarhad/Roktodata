import mongoose from "mongoose";
import { BD_PHONE_REGEX, DISTRICTS, FEEDBACK_ROLES, FEEDBACK_STATUS } from "../config/constants.js";

// A visitor's experience with Roktodata. Only admin-approved feedback is shown on the site, with
// the name and area; the phone number (optional) is for the admin only.
const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    district: { type: String, required: true, enum: DISTRICTS },
    upazila: { type: String, trim: true, maxlength: 60, default: "" },
    role: { type: String, required: true, enum: Object.keys(FEEDBACK_ROLES) },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    phoneNumber: { type: String, trim: true, match: BD_PHONE_REGEX, default: null },
    status: { type: String, enum: FEEDBACK_STATUS, default: "Pending" },
    // When it went on the site; the public list shows the most recently approved first.
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

feedbackSchema.index({ status: 1, approvedAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });

export const Feedback = mongoose.model("Feedback", feedbackSchema);
