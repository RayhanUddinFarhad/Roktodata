import mongoose from "mongoose";
import { Donor } from "../models/Donor.js";
import { ELIGIBILITY_DAYS, NO_NAME, SEARCH_PAGE_SIZE } from "../config/constants.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Finds donors that can be shown publicly: approved by an admin, marked ready to donate,
// and either never donated or donated at least ELIGIBILITY_DAYS ago.
// Donors with a name come first, then whoever donated longest ago.
// `upazila` keeps donors in that thana/upazila; `excludeUpazila` drops them instead.
// Returns one page of donors plus the total number of matches.
export async function findDonors({ bloodGroup, district, upazila, excludeUpazila, page = 1, limit = SEARCH_PAGE_SIZE }) {
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
  // Thanas are picked from a fixed per-district list, so they are matched exactly.
  if (upazila) filter.upazila = upazila;
  else if (excludeUpazila) filter.upazila = mongoose.trusted({ $ne: excludeUpazila });

  const [result] = await Donor.aggregate([
    { $match: filter },
    { $addFields: { hasName: { $ne: ["$fullName", NO_NAME] } } },
    { $sort: { hasName: -1, lastDonationDate: 1, _id: 1 } },
    {
      $facet: {
        donors: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { fullName: 1, phoneNumber: 1, bloodGroup: 1, district: 1, upazila: 1, lastDonationDate: 1 } },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  return {
    total: result.total[0]?.count ?? 0,
    donors: result.donors.map((donor) => ({
      id: donor._id.toString(),
      fullName: donor.fullName,
      phoneNumber: donor.phoneNumber,
      bloodGroup: donor.bloodGroup,
      district: donor.district,
      upazila: donor.upazila,
      lastDonationDate: donor.lastDonationDate ? donor.lastDonationDate.toISOString().slice(0, 10) : null,
    })),
  };
}
