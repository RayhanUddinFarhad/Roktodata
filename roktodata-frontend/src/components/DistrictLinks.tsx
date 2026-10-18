import Link from "next/link";
import { DISTRICTS, toBanglaNumber } from "@/lib/data";
import { districtSlug } from "@/lib/seo";
import type { DonorStats } from "@/lib/stats";

// DISTRICTS is ordered by division; these are the division names and how many districts each has.
const DIVISION_SIZES: [string, number][] = [
  ["ঢাকা বিভাগ", 13],
  ["চট্টগ্রাম বিভাগ", 11],
  ["রাজশাহী বিভাগ", 8],
  ["খুলনা বিভাগ", 10],
  ["বরিশাল বিভাগ", 6],
  ["সিলেট বিভাগ", 4],
  ["রংপুর বিভাগ", 8],
  ["ময়মনসিংহ বিভাগ", 4],
];

const DIVISIONS = DIVISION_SIZES.map(([division, size], i) => {
  const start = DIVISION_SIZES.slice(0, i).reduce((sum, [, n]) => sum + n, 0);
  return { division, districts: DISTRICTS.slice(start, start + size) };
});

// Links to every district page, grouped by division, with the number of available donors.
export default function DistrictLinks({ stats, current }: { stats: DonorStats; current?: string }) {
  return (
    <div className="space-y-4">
      {DIVISIONS.map(({ division, districts }) => {
        return (
          <div key={division}>
            <h3 className="text-xs font-bold text-slate-500">{division}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {districts.map((district) => {
                const total = stats.byDistrict[district]?.total ?? 0;
                const active = district === current;
                return (
                  <li key={district}>
                    <Link
                      href={`/donors/${districtSlug(district)}`}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:text-red-600"
                      }`}
                    >
                      {district}
                      {total > 0 && (
                        <span className={`font-mono text-[10px] ${active ? "text-red-100" : "text-slate-400"}`}>
                          {toBanglaNumber(total)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
