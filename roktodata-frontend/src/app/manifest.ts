import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Makes the site installable as an app (Android, desktop Chrome/Edge; iPhone through "Add to Home
// Screen"). The same manifest is what an Android Play Store build (TWA) would wrap later.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "রক্তদাতা (Roktodata)",
    short_name: "রক্তদাতা",
    description: "সারাদেশের রক্তদাতাদের নির্ভরযোগ্য ডিজিটাল নেটওয়ার্ক: জরুরি মুহূর্তে রক্তদাতা খুঁজুন, রক্তদাতা হোন।",
    lang: "bn",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#dc2626",
    categories: ["health", "medical", "social"],
    // Lets the site ask the browser whether the app is already installed (getInstalledRelatedApps).
    related_applications: [{ platform: "webapp", url: `${SITE_URL}/manifest.webmanifest` }],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "ডোনার খুঁজুন", url: "/find-donor", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "রক্তের অনুরোধ", url: "/blood-requests", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "রক্তদাতা হোন", url: "/register", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
