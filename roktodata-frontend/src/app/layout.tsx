import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import localFont from "next/font/local";
import JsonLd from "@/components/JsonLd";
import { CONTACT_EMAIL, FACEBOOK_URL } from "@/lib/data";
import { OG_IMAGE, SITE_NAME, SITE_NAME_EN, SITE_URL } from "@/lib/seo";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["400", "600", "700"], // 500 is not used: fewer fonts to load before text shows
});

// Digits only (0-9 and ০-৯), which are clearer in Noto Sans Bengali; all other text stays Hind Siliguri.
const digits = localFont({
  src: "./fonts/noto-sans-bengali-digits.woff2",
  variable: "--font-digits",
  weight: "400 700",
  // No size-adjusted Arial fallback: it would cover every character, not just digits.
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0030-0039, U+09E6-09EF" }],
});

// Defaults for every page; public pages add their own title, description and canonical URL
// through pageMetadata().
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "রক্তদাতা | Roktodata",
  description: "সারাদেশের রক্তদাতাদের নির্ভরযোগ্য ডিজিটাল নেটওয়ার্ক",
  applicationName: `${SITE_NAME} (${SITE_NAME_EN})`,
  keywords: ["রক্তদাতা", "রক্ত", "রক্তদান", "ব্লাড ডোনার", "blood donor", "blood donor Bangladesh", "Roktodata", "জরুরি রক্ত"],
  openGraph: { type: "website", siteName: `${SITE_NAME} (${SITE_NAME_EN})`, locale: "bn_BD", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
};

// Tells search engines who runs the site and what it is called.
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: SITE_NAME_EN,
      url: SITE_URL,
      logo: `${SITE_URL}/apple-icon.png`,
      email: CONTACT_EMAIL,
      sameAs: [FACEBOOK_URL],
      areaServed: "BD",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: SITE_NAME_EN,
      url: SITE_URL,
      inLanguage: "bn-BD",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} ${digits.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <JsonLd data={SITE_JSON_LD} />
        {children}
      </body>
    </html>
  );
}
