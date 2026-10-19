import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Megaphone, Search } from "lucide-react";
import DonationBenefits from "@/components/home/DonationBenefits";
import FacebookPage from "@/components/home/FacebookPage";
import HowItWorks from "@/components/home/HowItWorks";
import ShareDonorList from "@/components/home/ShareDonorList";
import { BLOOD_GROUPS, DISTRICTS, toBanglaNumber } from "@/lib/data";
import { districtSlug, pageMetadata } from "@/lib/seo";
import { getDonorStats } from "@/lib/stats";

const selectClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-red-500 focus:outline-none";

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
        <h1 className="mx-auto mt-3 max-w-2xl text-[26px] font-bold leading-tight sm:mt-4 sm:text-[34px]">
          সারাদেশের রক্তদাতাদের নির্ভরযোগ্য ডিজিটাল নেটওয়ার্ক
        </h1>
        <p className="mt-2 text-xs font-semibold tracking-wide text-red-200">
          রক্তের ডোনার · ব্লাড ডোনার · Blood Donor Bangladesh
        </p>
        <p className="mx-auto mt-3 hidden max-w-md text-sm text-slate-200 sm:block">
          জরুরী মুহূর্তে সঠিক রক্তদাতা খুঁজুন অথবা নিজেই রক্তদাতা হিসেবে যুক্ত হয়ে মানবতার সেবায় অংশ নিন।
        </p>

        <form
          id="search"
          action="/find-donor"
          className="mx-auto mt-5 grid max-w-lg scroll-mt-20 gap-3 rounded-lg bg-white p-4 text-left shadow-xl sm:grid-cols-3 sm:items-end"
        >
          <label className="block">
            <span className="mb-1 block text-[11px] text-slate-600">রক্তের গ্রুপ</span>
            <select name="bloodGroup" defaultValue="" className={selectClass}>
              <option value="">সব গ্রুপ</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-slate-600">জেলা</span>
            <select name="district" defaultValue="" className={selectClass}>
              <option value="">সকল জেলা</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="flex h-10 items-center justify-center gap-1.5 rounded-md bg-red-600 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700"
          >
            <Search className="h-4 w-4" />
            ডোনার খুঁজুন
          </button>
        </form>

        <p className="mt-4 text-xs font-semibold text-slate-200">
          <span className="text-white">হাজারো রক্তদাতা</span>
          <span className="mx-2 text-slate-500">·</span>৬৪ জেলা
          <span className="mx-2 text-slate-500">·</span>সম্পূর্ণ বিনামূল্যে
        </p>
        <Link
          href="/patient-search"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-200 underline-offset-4 hover:text-white hover:underline"
        >
          <Megaphone className="h-3.5 w-3.5" />
          ডোনার পাননি? রোগীর তথ্য দিয়ে অনুরোধ করুন
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {popular.length > 0 && (
        <section className="px-4 py-12">
          <div className="mx-auto max-w-[808px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <MapPin className="h-5 w-5 text-red-600" />
                  জেলা অনুযায়ী রক্তের ডোনার খুঁজুন
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">Find blood donors by district</p>
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
                    <span className="font-mono text-[11px] text-slate-400">{toBanglaNumber(total)} জন</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <HowItWorks />
      <DonationBenefits />
      <ShareDonorList />
      <FacebookPage />
    </main>
  );
}
