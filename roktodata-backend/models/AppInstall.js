import mongoose from "mongoose";

export const APP_PLATFORMS = ["android", "ios", "desktop", "other"];

// One device that installed the app (counted when the browser reports the install, or the first
// time the app is opened from the home screen, which also covers iPhones and installs from before
// counting began). `device` is a random id the site keeps on the device, so a device counts once.
const appInstallSchema = new mongoose.Schema(
  {
    device: { type: String, required: true, unique: true, maxlength: 64 },
    platform: { type: String, enum: APP_PLATFORMS, default: "other" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

appInstallSchema.index({ createdAt: -1 });

export const AppInstall = mongoose.model("AppInstall", appInstallSchema);
