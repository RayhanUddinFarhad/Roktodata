// One-time: donors who were already "not ready" before notReadySince existed get their last update
// time as an estimate of when they hid, so the admin's hidden-donor list can be sorted.
// Usage: node --env-file=.env scripts/backfill-not-ready-since.js
import { connectDB, disconnectDB } from "../config/db.js";
import { Donor } from "../models/Donor.js";

await connectDB();
const result = await Donor.updateMany({ isReadyToDonate: false, notReadySince: null }, [{ $set: { notReadySince: "$updatedAt" } }], {
  updatePipeline: true,
  timestamps: false,
});
console.log(`notReadySince set for ${result.modifiedCount} donors (from their last update time).`);
await disconnectDB();
