import mongoose from "mongoose";
import { Donor } from "../models/Donor.js";
import { ELIGIBILITY_DAYS, MAX_SEARCH_RESULTS } from "../config/constants.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Finds donors that can be shown publicly: approved by an admin, marked ready to donate,
// and either never donated or donated at least ELIGIBILITY_DAYS ago.
// Whoever donated longest ago comes first.
// `upazila` keeps donors whose upazila starts with it; `excludeUpazila` drops them instead.
export async function findDonors({ bloodGroup, district, upazila, excludeUpazila }) {
  const cutoff = new Date(Date.now() - ELIGIBILITY_DAYS * DAY_MS);

  // Operator objects are built here from validated values, so they are marked trusted
  // to stop sanitizeFilter from neutralising them.
  const filter = {
    status: "Active",
    isReadyToDonate: true,
    $or: [{ lastDonationDate: null }, { lastDonationDate: mongoose.trusted({ $lte: cutoff }) }],
  };
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (district) filter.district = district;
  // Prefix match so "ধান" finds "ধানমন্ডি"; anchored regexes can still use the compound index.
  if (upazila) filter.upazila = mongoose.trusted({ $regex: `^${escapeRegex(upazila)}`, $options: "i" });
  else if (excludeUpazila) {
    filter.upazila = mongoose.trusted({ $not: new RegExp(`^${escapeRegex(excludeUpazila)}`, "i") });
  }

  const donors = await Donor.find(filter)
    .sort({ lastDonationDate: 1, _id: 1 })
    .limit(MAX_SEARCH_RESULTS)
    .select("fullName phoneNumber bloodGroup district upazila lastDonationDate")
    .lean();

  return donors.map((donor) => ({
    id: donor._id.toString(),
    fullName: donor.fullName,
    phoneNumber: donor.phoneNumber,
    bloodGroup: donor.bloodGroup,
    district: donor.district,
    upazila: donor.upazila,
    lastDonationDate: donor.lastDonationDate ? donor.lastDonationDate.toISOString().slice(0, 10) : null,
  }));
}
