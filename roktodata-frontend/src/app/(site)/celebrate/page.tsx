import type { Metadata } from "next";
import { Galada } from "next/font/google";
import PhotoCardMaker from "@/components/photocard/PhotoCardMaker";
import { pageMetadata } from "@/lib/seo";

// Decorative Bangla script for the certificate and nakshi-kantha cards (only loaded on this page).
const galada = Galada({ weight: "400", subsets: ["bengali"], display: "swap" });

export const metadata: Metadata = pageMetadata({
  title: "আমার রক্তদান ফটোকার্ড | Blood Donation Photo Card | রক্তদাতা",
  description:
    "আপনি কতবার রক্ত দিয়েছেন? নাম, রক্তের গ্রুপ আর সংখ্যা দিয়ে নিজের রক্তদানের ফটোকার্ড বানান: ডোনার আইডি কার্ড, রক্তের ব্যাগ, রক্তদান কাউন্টডাউন, সম্মাননা সনদ, নকশিকাঁথা বা মেডেল ডিজাইনে। বিনামূল্যে ডাউনলোড করে ফেসবুক, ইনস্টাগ্রাম, WhatsApp-এ শেয়ার করুন।",
  path: "/celebrate",
});

export default function CelebratePage() {
  return (
    <main className="flex-1 bg-[#faf7f2]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 text-center lg:text-left">
          <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">রক্তদান উদযাপন</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">আমি যতবার রক্ত দিয়েছি</h1>
          <p className="mt-1 text-sm text-slate-600">
            নিজের রক্তদানের ফটোকার্ড বানান, শেয়ার করুন, আর অন্যদেরও রক্ত দিতে উৎসাহ দিন।
          </p>
        </div>
        <PhotoCardMaker decoFont={galada.style.fontFamily} />
      </div>
    </main>
  );
}
