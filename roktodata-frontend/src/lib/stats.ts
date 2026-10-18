import { cacheLife } from "next/cache";
import { API_URL } from "@/lib/api";
import type { BloodGroup } from "@/lib/data";

export interface DistrictStats {
  total: number;
  groups: Partial<Record<BloodGroup, number>>;
}

export interface DonorStats {
  // false when the API couldn't be reached: pages then leave numbers out instead of showing zero.
  available: boolean;
  total: number;
  byDistrict: Record<string, DistrictStats>;
}

const UNAVAILABLE: DonorStats = { available: false, total: 0, byDistrict: {} };

// Counts of donors currently shown on the site, per district and blood group (no personal data).
// Cached for an hour. If the API can't be reached the pages render without numbers, and that
// result is only kept for a few minutes so the numbers come back soon.
export async function getDonorStats(): Promise<DonorStats> {
  "use cache";
  try {
    const res = await fetch(`${API_URL}/api/donors/stats`, { signal: AbortSignal.timeout(60_000) });
    const data = await res.json();
    if (data?.success) {
      cacheLife("hours");
      return { available: true, total: data.total, byDistrict: data.byDistrict };
    }
  } catch {
    // Falls through to UNAVAILABLE.
  }
  cacheLife("minutes");
  return UNAVAILABLE;
}

export const districtStats = (stats: DonorStats, district: string): DistrictStats =>
  stats.byDistrict[district] ?? { total: 0, groups: {} };
