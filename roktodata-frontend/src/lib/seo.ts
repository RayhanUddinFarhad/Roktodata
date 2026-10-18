import type { Metadata } from "next";
import type { BloodGroup } from "@/lib/data";

// Public address of the site, used for canonical URLs, the sitemap and share previews.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.roktodata.org").replace(/\/+$/, "");
export const SITE_NAME = "রক্তদাতা";
export const SITE_NAME_EN = "Roktodata";

// URL slug for each district page (/donors/<slug>), in English so links stay readable when shared.
// Keys must match DISTRICTS in lib/data.ts.
const DISTRICT_SLUGS: Record<string, string> = {
  "ঢাকা": "dhaka",
  "গাজীপুর": "gazipur",
  "নারায়ণগঞ্জ": "narayanganj",
  "নরসিংদী": "narsingdi",
  "মানিকগঞ্জ": "manikganj",
  "মুন্সিগঞ্জ": "munshiganj",
  "টাঙ্গাইল": "tangail",
  "কিশোরগঞ্জ": "kishoreganj",
  "ফরিদপুর": "faridpur",
  "গোপালগঞ্জ": "gopalganj",
  "মাদারীপুর": "madaripur",
  "রাজবাড়ী": "rajbari",
  "শরীয়তপুর": "shariatpur",
  "চট্টগ্রাম": "chattogram",
  "কক্সবাজার": "coxs-bazar",
  "রাঙ্গামাটি": "rangamati",
  "বান্দরবান": "bandarban",
  "খাগড়াছড়ি": "khagrachhari",
  "কুমিল্লা": "cumilla",
  "ব্রাহ্মণবাড়িয়া": "brahmanbaria",
  "চাঁদপুর": "chandpur",
  "লক্ষ্মীপুর": "lakshmipur",
  "নোয়াখালী": "noakhali",
  "ফেনী": "feni",
  "রাজশাহী": "rajshahi",
  "নাটোর": "natore",
  "নওগাঁ": "naogaon",
  "চাঁপাইনবাবগঞ্জ": "chapainawabganj",
  "পাবনা": "pabna",
  "সিরাজগঞ্জ": "sirajganj",
  "বগুড়া": "bogura",
  "জয়পুরহাট": "joypurhat",
  "খুলনা": "khulna",
  "যশোর": "jashore",
  "সাতক্ষীরা": "satkhira",
  "বাগেরহাট": "bagerhat",
  "নড়াইল": "narail",
  "মাগুরা": "magura",
  "ঝিনাইদহ": "jhenaidah",
  "কুষ্টিয়া": "kushtia",
  "চুয়াডাঙ্গা": "chuadanga",
  "মেহেরপুর": "meherpur",
  "বরিশাল": "barishal",
  "পটুয়াখালী": "patuakhali",
  "ভোলা": "bhola",
  "পিরোজপুর": "pirojpur",
  "বরগুনা": "barguna",
  "ঝালকাঠি": "jhalokathi",
  "সিলেট": "sylhet",
  "মৌলভীবাজার": "moulvibazar",
  "হবিগঞ্জ": "habiganj",
  "সুনামগঞ্জ": "sunamganj",
  "রংপুর": "rangpur",
  "দিনাজপুর": "dinajpur",
  "ঠাকুরগাঁও": "thakurgaon",
  "পঞ্চগড়": "panchagarh",
  "নীলফামারী": "nilphamari",
  "লালমনিরহাট": "lalmonirhat",
  "কুড়িগ্রাম": "kurigram",
  "গাইবান্ধা": "gaibandha",
  "ময়মনসিংহ": "mymensingh",
  "জামালপুর": "jamalpur",
  "শেরপুর": "sherpur",
  "নেত্রকোণা": "netrokona",
};

export const districtSlug = (district: string): string | undefined => DISTRICT_SLUGS[district];

const BY_SLUG = new Map(Object.entries(DISTRICT_SLUGS).map(([district, slug]) => [slug, district]));
export const districtFromSlug = (slug: string) => BY_SLUG.get(slug);

export const districtSlugs = () => Object.values(DISTRICT_SLUGS);

// Share preview image (public/og-image.png) used by every page.
export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "রক্তদাতা: সারাদেশের রক্তদাতাদের নির্ভরযোগ্য ডিজিটাল নেটওয়ার্ক",
};

// Title, description, canonical URL and share preview for a public page. `path` is relative to SITE_URL.
// `noindex` keeps a page out of search results (e.g. a district page with no donors yet).
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    ...(noindex && { robots: { index: false, follow: true } }),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: `${SITE_NAME} (${SITE_NAME_EN})`,
      locale: "bn_BD",
      title,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

// English district names as people search for them; the second name is the other common spelling
// ("Chittagong" is still searched far more than "Chattogram").
const DISTRICT_EN_OVERRIDES: Record<string, [string, string?]> = {
  chattogram: ["Chittagong", "Chattogram"],
  cumilla: ["Comilla", "Cumilla"],
  barishal: ["Barisal", "Barishal"],
  jashore: ["Jessore", "Jashore"],
  bogura: ["Bogra", "Bogura"],
  "coxs-bazar": ["Cox's Bazar"],
  jhalokathi: ["Jhalokathi", "Jhalakathi"],
  netrokona: ["Netrokona", "Netrakona"],
  chapainawabganj: ["Chapainawabganj", "Nawabganj"],
};

// "Chittagong (Chattogram)", "Dhaka".
export function districtEnglish(slug: string): string {
  const [name, alt] = DISTRICT_EN_OVERRIDES[slug] ?? [slug.charAt(0).toUpperCase() + slug.slice(1)];
  return alt ? `${name} (${alt})` : name;
}

// The first English name only, for short titles: "Chittagong".
export const districtEnglishShort = (slug: string) => districtEnglish(slug).replace(/ \(.*\)$/, "");

// Blood group pages: /donors/<district>/<group slug>.
const GROUPS: [BloodGroup, string, string, string][] = [
  ["A+", "a-positive", "A positive", "এ পজিটিভ"],
  ["A-", "a-negative", "A negative", "এ নেগেটিভ"],
  ["B+", "b-positive", "B positive", "বি পজিটিভ"],
  ["B-", "b-negative", "B negative", "বি নেগেটিভ"],
  ["AB+", "ab-positive", "AB positive", "এবি পজিটিভ"],
  ["AB-", "ab-negative", "AB negative", "এবি নেগেটিভ"],
  ["O+", "o-positive", "O positive", "ও পজিটিভ"],
  ["O-", "o-negative", "O negative", "ও নেগেটিভ"],
];
export const groupSlug = (group: BloodGroup) => GROUPS.find(([g]) => g === group)![1];
export const groupFromSlug = (slug: string) => GROUPS.find(([, s]) => s === slug)?.[0];
export const groupEnglish = (group: BloodGroup) => GROUPS.find(([g]) => g === group)![2];
export const groupBangla = (group: BloodGroup) => GROUPS.find(([g]) => g === group)![3];
export const groupSlugs = () => GROUPS.map(([, slug]) => slug);
