import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, MapPin } from "lucide-react";
import DonationBenefits from "@/components/home/DonationBenefits";
import HeroSearch from "@/components/home/HeroSearch";
import FacebookPage from "@/components/home/FacebookPage";
import HowItWorks from "@/components/home/HowItWorks";
import LearnTeaser from "@/components/home/LearnTeaser";
import PhotoCardBanner from "@/components/home/PhotoCardBanner";
import RequestPosterBanner from "@/components/home/RequestPosterBanner";
import ShareDonorList from "@/components/home/ShareDonorList";
import { toBanglaNumber } from "@/lib/data";
import { districtSlug, pageMetadata } from "@/lib/seo";
import { getDonorStats } from "@/lib/stats";

export const metadata: Metadata = pageMetadata({
  title: "রক্তদাতা | রক্তের ডোনার খুঁজুন · Blood Donor Bangladesh",
  description:
    "রক্তের ডোনার (ব্লাড ডোনার) খুঁজুন: সারাদেশের হাজারো রক্তদাতা, রক্তের গ্রুপ, জেলা ও থানা অনুযায়ী, সরাসরি ফোনে, বিনামূল্যে। Find a blood donor anywhere in Bangladesh.",
  path: "/",
});

export default async function Home() {
  const stats = await getDonorStats();
  // Districts with the most donors, for quick links (and internal links for search engines).
  const popular = Object.entries(stats.byDistrict)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 12)
    .map(([district, { total }]) => ({ district, total }));

  return (
    <main className="flex-1 bg-slate-50">
      <section className="bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] px-4 pb-10 pt-8 text-center text-white sm:py-14">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/70 bg-red-950/40 px-3 py-1 text-xs text-red-100">
          <Heart className="h-3 w-3 text-pink-400" fill="currentColor" />
          এক ফোঁটা রক্ত, বাঁচাতে পারে একটি প্রাণ
        </span>
        <h1 className="mx-auto mt-3 max-w-3xl text-[26px] font-bold leading-tight sm:mt-4 sm:text-[34px]">
          সারাদেশের রক্তদাতাদের নির্ভরযোগ্য ডিজিটাল নেটওয়ার্ক
        </h1>

        <HeroSearch />

        <p className="mt-4 flex flex-col items-center gap-2 text-xs text-slate-300 sm:flex-row sm:justify-center sm:gap-0">
          <span>হাজারো রক্তদাতা · ৬৪ জেলা · বিনামূল্যে</span>
          <span className="mx-2 hidden text-slate-500 sm:inline">|</span>
          <Link href="/patient-search" className="font-semibold text-red-200 underline-offset-4 hover:text-white hover:underline">
            ডোনার পাননি? অনুরোধ করুন →
          </Link>
        </p>
      </section>

      <RequestPosterBanner />
      <PhotoCardBanner />

      {popular.length > 0 && (
        <section className="px-4 pb-12 pt-8">
          <div className="mx-auto max-w-[808px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <MapPin className="h-5 w-5 text-red-600" />
                  জেলা অনুযায়ী রক্তের ডোনার খুঁজুন
                </h2>
              </div>
              <Link href="/donors" className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700">
                ৬৪ জেলা দেখুন
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {popular.map(({ district, total }) => (
                <li key={district}>
                  <Link
                    href={`/donors/${districtSlug(district)}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    {district}
                    <span className="font-mono text-[11px] text-slate-500">{toBanglaNumber(total)} জন</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <HowItWorks />
      <DonationBenefits />
      <LearnTeaser />
      <ShareDonorList />
      <FacebookPage />
    </main>
  );
}
