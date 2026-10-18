import { cacheLife } from "next/cache";
import { API_URL } from "@/lib/api";
import type { BloodGroup } from "@/lib/data";

export interface DistrictStats {
  total: number;
  groups: Partial<Record<BloodGroup, number>>;
}

export interface DonorStats {
  total: number;
  byDistrict: Record<string, DistrictStats>;
}

const EMPTY: DonorStats = { total: 0, byDistrict: {} };

// Counts of donors currently shown on the site, per district and blood group (no personal data).
// Cached for an hour; if the API can't be reached the pages render without numbers.
export async function getDonorStats(): Promise<DonorStats> {
  "use cache";
  cacheLife("hours");
  try {
    const res = await fetch(`${API_URL}/api/donors/stats`, { signal: AbortSignal.timeout(60_000) });
    const data = await res.json();
    return data?.success ? { total: data.total, byDistrict: data.byDistrict } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export const districtStats = (stats: DonorStats, district: string): DistrictStats =>
  stats.byDistrict[district] ?? { total: 0, groups: {} };
