import mongoose from "mongoose";

export const CONTACT_TYPES = ["call", "whatsapp"];

// One tap on a donor's "কল করুন" or "WhatsApp" button. The site can't know whether the call or
// message really happened, only that someone tapped to make it. The visitor is kept only as a
// one-way hash of their IP, to count repeat taps once.
const donorContactSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", required: true },
    type: { type: String, enum: CONTACT_TYPES, required: true },
    visitor: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Admin totals by day, and the "same visitor, same donor, just now" check.
donorContactSchema.index({ createdAt: -1 });
donorContactSchema.index({ donor: 1, type: 1, visitor: 1, createdAt: -1 });

export const DonorContact = mongoose.model("DonorContact", donorContactSchema);
