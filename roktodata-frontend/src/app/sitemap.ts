import type { MetadataRoute } from "next";
import { districtSlugs, SITE_URL } from "@/lib/seo";

// Public pages plus one page per district. The admin panel is left out on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["/", 1, "daily"],
    ["/find-donor", 0.9, "daily"],
    ["/donors", 0.9, "daily"],
    ["/patient-search", 0.8, "weekly"],
    ["/blood-requests", 0.8, "daily"],
    ["/register", 0.8, "monthly"],
    ["/fraud-donors", 0.6, "weekly"],
    ["/about", 0.5, "monthly"],
  ];
  return [
    ...pages.map(([path, priority, changeFrequency]) => ({ url: `${SITE_URL}${path}`, priority, changeFrequency })),
    ...districtSlugs().map((slug) => ({ url: `${SITE_URL}/donors/${slug}`, priority: 0.7, changeFrequency: "daily" as const })),
  ];
}
