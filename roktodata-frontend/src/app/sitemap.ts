import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/articles";
import { BLOOD_GROUPS } from "@/lib/data";
import { districtFromSlug, districtSlugs, groupSlug, SITE_URL } from "@/lib/seo";
import { getDonorStats } from "@/lib/stats";

// Public pages, one page per district and one per district + blood group. Pages without donors are
// left out (they are also marked noindex). The admin panel is left out on purpose.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stats = await getDonorStats();
  // If the counts can't be loaded, list every page rather than none.
  const has = (district: string, group?: (typeof BLOOD_GROUPS)[number]) => {
    if (!stats.available) return true;
    const entry = stats.byDistrict[district];
    return group ? (entry?.groups[group] ?? 0) > 0 : (entry?.total ?? 0) > 0;
  };

  const pages: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["/", 1, "daily"],
    ["/find-donor", 0.9, "daily"],
    ["/donors", 0.9, "daily"],
    ["/patient-search", 0.8, "weekly"],
    ["/blood-requests", 0.8, "daily"],
    ["/register", 0.8, "monthly"],
    ["/fraud-donors", 0.6, "weekly"],
    ["/celebrate", 0.7, "monthly"],
    ["/learn", 0.8, "weekly"],
    ["/app", 0.6, "monthly"],
    ["/feedback", 0.6, "weekly"],
    ["/about", 0.5, "monthly"],
  ];
  const entries: MetadataRoute.Sitemap = pages.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`,
    priority,
    changeFrequency,
  }));

  for (const a of ARTICLES) {
    entries.push({ url: `${SITE_URL}/learn/${a.slug}`, lastModified: a.updated, priority: 0.7, changeFrequency: "monthly" });
  }

  for (const slug of districtSlugs()) {
    const district = districtFromSlug(slug)!;
    if (!has(district)) continue;
    entries.push({ url: `${SITE_URL}/donors/${slug}`, priority: 0.8, changeFrequency: "daily" });
    for (const group of BLOOD_GROUPS) {
      if (has(district, group)) {
        entries.push({ url: `${SITE_URL}/donors/${slug}/${groupSlug(group)}`, priority: 0.7, changeFrequency: "daily" });
      }
    }
  }
  return entries;
}
