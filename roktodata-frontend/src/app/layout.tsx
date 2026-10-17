import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
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

export const metadata: Metadata = {
  title: "রক্তদাতা | Roktodata",
  description: "সারাদেশের রক্তদাতাদের নির্ভরযোগ্য ডিজিটাল নেটওয়ার্ক",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} ${digits.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
