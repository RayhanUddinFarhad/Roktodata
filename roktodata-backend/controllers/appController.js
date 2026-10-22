import { AppInstall } from "../models/AppInstall.js";

// POST /api/app/install: counts a device that installed (or first opened) the app; repeats are ignored.
export async function recordInstall(req, res) {
  const { device, platform } = req.validated;
  await AppInstall.updateOne({ device }, { $setOnInsert: { device, platform } }, { upsert: true });
  res.json({ success: true });
}
