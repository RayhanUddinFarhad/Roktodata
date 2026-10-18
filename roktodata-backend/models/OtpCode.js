import mongoose from "mongoose";
import { BD_PHONE_REGEX } from "../config/constants.js";

// One document per verification SMS. Only an HMAC of the code is stored. Documents are kept for
// 24 hours (TTL on createdAt) so they also serve as the per-number and site-wide daily SMS count.
const otpCodeSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, match: BD_PHONE_REGEX },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

otpCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
otpCodeSchema.index({ phoneNumber: 1, createdAt: -1 });

export const OtpCode = mongoose.model("OtpCode", otpCodeSchema);
