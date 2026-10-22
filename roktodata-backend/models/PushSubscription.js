import mongoose from "mongoose";
import { DISTRICTS } from "../config/constants.js";

// One browser or installed app that allowed notifications. Its area comes from the visitor's IP
// address (refreshed whenever the app is opened) unless they picked a district themselves.
const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true, maxlength: 1000 },
    keys: {
      p256dh: { type: String, required: true, maxlength: 200 },
      auth: { type: String, required: true, maxlength: 100 },
    },
    district: { type: String, enum: [...DISTRICTS, null], default: null },
    // Where the subscriber probably is (IP location, or the chosen district's town).
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    districtChosen: { type: Boolean, default: false },
    // Set when a donor registers or updates on this device; used for the "you can donate again" reminder.
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "Donor", default: null },
    // Blood-request notifications sent on requestPushDay (Bangladesh day), to cap them per day.
    requestPushDay: { type: String, default: "" },
    requestPushCount: { type: Number, default: 0 },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Devices not seen for half a year are dropped (the app re-registers itself whenever it opens).
pushSubscriptionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
pushSubscriptionSchema.index({ donor: 1 }, { partialFilterExpression: { donor: { $type: "objectId" } } });
pushSubscriptionSchema.index({ district: 1 });

export const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);
