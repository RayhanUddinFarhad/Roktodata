import mongoose from "mongoose";
import { Donor } from "../models/Donor.js";
import { ELIGIBILITY_DAYS, NO_NAME, SEARCH_PAGE_SIZE } from "../config/constants.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Donors that can be shown publicly: approved by an admin, ready to donate (marked ready, or "not
// ready" with a return date that has passed), and either never donated or donated at least
// ELIGIBILITY_DAYS ago. The date operators are built here, so they are marked trusted to stop
// sanitizeFilter from neutralising them.
export function visibleDonorFilter() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - ELIGIBILITY_DAYS * DAY_MS);
  return {
    status: "Active",
    $and: [
      { $or: [{ isReadyToDonate: true }, { readyAgainAt: mongoose.trusted({ $lte: now }) }] },
      { $or: [{ lastDonationDate: null }, { lastDonationDate: mongoose.trusted({ $lte: cutoff }) }] },
    ],
  };
}

// The same rule as visibleDonorFilter for one approved donor: why the public search leaves them out
// ("not_ready" or "recent_donation") and the day they come back (null if they never come back by
// themselves), or null while they are shown.
export function searchHiddenReason(donor, now = new Date()) {
  const notReady = !donor.isReadyToDonate && !(donor.readyAgainAt && donor.readyAgainAt <= now);
  const eligibleAt = donor.lastDonationDate ? new Date(donor.lastDonationDate.getTime() + ELIGIBILITY_DAYS * DAY_MS) : null;
  const recent = eligibleAt && eligibleAt > now;
  if (!notReady && !recent) return null;
  const until = notReady ? (donor.readyAgainAt && recent && eligibleAt > donor.readyAgainAt ? eligibleAt : donor.readyAgainAt) : eligibleAt;
  return { reason: notReady ? "not_ready" : "recent_donation", until: until ?? null };
}

// Website registrations have needed an SMS code since this time; ones saved before verifiedAt existed
// count as verified from their creation.
const SMS_CODE_SINCE = new Date("2026-10-18T05:53:46Z");

// Finds visible donors (see visibleDonorFilter). Donors who registered or updated themselves with an
// SMS code come first (an imported donor too, once they update), then those with a name, then whoever
// donated longest ago.
// `upazila` keeps donors in that thana/upazila; `excludeUpazila` drops them instead.
// Returns one page of donors plus the total number of matches.
export async function findDonors({ bloodGroup, district, upazila, excludeUpazila, page = 1, limit = SEARCH_PAGE_SIZE }) {
  const filter = visibleDonorFilter();
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (district) filter.district = district;
  // Thanas are picked from a fixed per-district list, so they are matched exactly.
  if (upazila) filter.upazila = upazila;
  // Built from a validated value, so marked trusted like the date operator.
  else if (excludeUpazila) filter.upazila = mongoose.trusted({ $ne: excludeUpazila });

  const [result] = await Donor.aggregate([
    { $match: filter },
    {
      $addFields: {
        verified: {
          $or: [
            { $ne: [{ $ifNull: ["$verifiedAt", null] }, null] },
            { $and: [{ $eq: [{ $ifNull: ["$source", "website"] }, "website"] }, { $gte: ["$createdAt", SMS_CODE_SINCE] }] },
          ],
        },
        hasName: { $ne: ["$fullName", NO_NAME] },
      },
    },
    { $sort: { verified: -1, hasName: -1, lastDonationDate: 1, _id: 1 } },
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
