import mongoose from "mongoose";
import { BLOOD_GROUPS, BD_PHONE_REGEX, DISTRICTS, DONOR_STATUS } from "../config/constants.js";

const donorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phoneNumber: {
      type: String,
      required: true,
      unique: true, // the unique index also serves phone-number lookups
      trim: true,
      match: BD_PHONE_REGEX,
    },
    bloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    district: { type: String, required: true, enum: DISTRICTS },
    upazila: { type: String, required: true, trim: true, maxlength: 60 },
    lastDonationDate: { type: Date, default: null },
    // Set by the donor: whether they are currently willing to donate.
    isReadyToDonate: { type: Boolean, default: true },
    status: { type: String, enum: DONOR_STATUS, default: "Pending" },
  },
  { timestamps: true },
);

// Serves the main search: blood group + district (+ upazila prefix).
donorSchema.index({ bloodGroup: 1, district: 1, upazila: 1 });
// Serves the admin lists (e.g. newest pending donors).
donorSchema.index({ status: 1, createdAt: -1 });

export const Donor = mongoose.model("Donor", donorSchema);
