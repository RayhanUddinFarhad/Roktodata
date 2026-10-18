import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Crosshair, Heart, MapPin, Search, UserCheck, Zap, type LucideIcon } from "lucide-react";
import DonationBenefits from "@/components/home/DonationBenefits";
import HowItWorks from "@/components/home/HowItWorks";
import ShareDonorList from "@/components/home/ShareDonorList";
import { BLOOD_GROUPS, DISTRICTS, toBanglaNumber } from "@/lib/data";
import { districtSlug, pageMetadata } from "@/lib/seo";
import { getDonorStats } from "@/lib/stats";

const FEATURES: { icon: LucideIcon; iconClass: string; title: string; text: string }[] = [
  {
    icon: UserCheck,
    iconClass: "bg-red-100 text-red-600",
    title: "সহজ রেজিস্ট্রেশন ও আপডেট",
    text: "মোবাইল নাম্বার দিয়ে সহজেই রেজিস্ট্রেশন করুন। নাম্বার আগে থেকে থাকলে শুধু শেষ রক্তদানের তারিখ আপডেট করে নিন।",
  },
  {
    icon: Crosshair,
    iconClass: "bg-blue-100 text-indigo-900",
    title: "থানা ও জেলা ভিত্তিক ফিল্টার",
    text: "আপনার নির্দিষ্ট এলাকা বা থানার কাছাকাছি রক্তদাতাদের খুব দ্রুত খুঁজে পেতে আমাদের স্মার্ট ফিল্টারিং সিস্টেম রয়েছে।",
  },
  {
    icon: Zap,
    iconClass: "bg-emerald-100 text-emerald-600",
    title: "লগইন ছাড়াই জরুরী সেবা",
    text: "রোগীর আত্মীয়-স্বজন কোনো প্রকার ঝামেলা বা লগইন ছাড়াই রোগীর তথ্য ও ঠিকানা দিয়ে তাৎক্ষণিকভাবে ডোনারদের তালিকা দেখতে পারবেন।",
  },
];

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
      <section className="bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] px-4 py-14 text-center text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/70 bg-red-950/40 px-3 py-1 text-xs text-red-100">
          <Heart className="h-3 w-3 text-pink-400" fill="currentColor" />
          এক ফোঁটা রক্ত, বাঁচাতে পারে একটি প্রাণ
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-[34px]">
          সারাদেশের রক্তদাতাদের নির্ভরযোগ্য ডিজিটাল নেটওয়ার্ক
        </h1>
        <p className="mt-2 text-xs font-semibold tracking-wide text-red-200">
          রক্তের ডোনার · ব্লাড ডোনার · Blood Donor Bangladesh
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-slate-200">
          জরুরী মুহূর্তে সঠিক রক্তদাতা খুঁজুন অথবা নিজেই রক্তদাতা হিসেবে যুক্ত হয়ে মানবতার সেবায় অংশ নিন।
        </p>

        <form
          id="search"
          action="/find-donor"
          className="mx-auto mt-6 grid max-w-lg scroll-mt-4 gap-3 rounded-lg bg-white p-4 text-left shadow-xl sm:grid-cols-3 sm:items-end"
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
      </section>

      <section className="bg-slate-50 px-4 py-12">
        <div className="mx-auto grid max-w-[808px] gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, iconClass, title, text }) => (
            <div
              key={title}
              className="rounded-lg border border-slate-100 bg-white p-6 text-center shadow-sm"
            >
              <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg ${iconClass}`}>
                <Icon className="h-5 w-5" fill={Icon === Zap ? "currentColor" : "none"} />
              </span>
              <h3 className="mt-3 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {popular.length > 0 && (
        <section className="px-4 pb-12">
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
    </main>
  );
}
