// One-time fix for donors who chose "not ready" only because their last donation was under 90 days
// ago: gives them a return date (last donation + 90 days), after which they show in search again.
// Donors without a last donation date are left alone, since their reason is unknown.
// Usage: node --env-file=.env scripts/resume-recent-donors.js          (counts only, changes nothing)
//        node --env-file=.env scripts/resume-recent-donors.js --apply  (writes the return dates)
// --saved-before=2026-10-21T17:47:00Z leaves out donors saved after that time (e.g. after the form
// started asking for a return date, so a deliberate "don't know" is not overridden).
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import { ELIGIBILITY_DAYS } from "../config/constants.js";
import { Donor } from "../models/Donor.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const apply = process.argv.includes("--apply");
const savedBefore = process.argv.find((a) => a.startsWith("--saved-before="))?.split("=")[1];

await connectDB();
const cutoff = new Date(Date.now() - ELIGIBILITY_DAYS * DAY_MS);
const filter = {
  isReadyToDonate: false,
  readyAgainAt: null,
  lastDonationDate: mongoose.trusted({ $gt: cutoff }),
  ...(savedBefore && { updatedAt: mongoose.trusted({ $lt: new Date(savedBefore) }) }),
};

const donors = await Donor.find(filter, { lastDonationDate: 1, status: 1 }).lean();
const byStatus = donors.reduce((acc, d) => ({ ...acc, [d.status]: (acc[d.status] ?? 0) + 1 }), {});
console.log(`"Not ready" donors whose last donation was under ${ELIGIBILITY_DAYS} days ago: ${donors.length}`, byStatus);

if (apply && donors.length) {
  const result = await Donor.bulkWrite(
    donors.map((d) => ({
      updateOne: {
        filter: { _id: d._id, isReadyToDonate: false, readyAgainAt: null },
        update: { $set: { readyAgainAt: new Date(d.lastDonationDate.getTime() + ELIGIBILITY_DAYS * DAY_MS) } },
      },
    })),
  );
  console.log(`Return dates set: ${result.modifiedCount}`);
} else if (!apply) {
  console.log("Nothing changed. Run with --apply to set their return dates.");
}
await disconnectDB();
