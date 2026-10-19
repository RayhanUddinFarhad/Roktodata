import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, UserPlus } from "lucide-react";
import DistrictLinks from "@/components/DistrictLinks";
import { toBanglaNumber } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { getDonorStats } from "@/lib/stats";

export const metadata: Metadata = pageMetadata({
  title: "জেলাভিত্তিক রক্তের ডোনার | Blood Donors by District | রক্তদাতা",
  description:
    "বাংলাদেশের ৬৪ জেলার রক্তদাতাদের তালিকা। আপনার জেলা বেছে নিয়ে রক্তের গ্রুপ ও থানা অনুযায়ী রক্তদাতা খুঁজুন এবং সরাসরি ফোন করুন।",
  path: "/donors",
});

export default async function DistrictsPage() {
  const stats = await getDonorStats();
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-0.5 text-[11px] font-semibold text-red-700">
            <MapPin className="h-3 w-3" />
            ৬৪ জেলা
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">জেলাভিত্তিক রক্তদাতা</h1>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">Blood donors in all 64 districts of Bangladesh</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {stats.total > 0 && (
              <>
                সারাদেশে এখন <strong className="text-slate-900">{toBanglaNumber(stats.total)} জন</strong> রক্তদাতা রক্ত দিতে
                প্রস্তুত।{" "}
              </>
            )}
            আপনার জেলা বেছে নিন, তারপর রক্তের গ্রুপ ও থানা অনুযায়ী রক্তদাতা খুঁজে সরাসরি ফোন করুন। জেলার পাশের সংখ্যাটি
            সেখানে এখন কতজন রক্তদাতা আছেন তা দেখায়।
          </p>
          <div className="mt-6">
            <DistrictLinks stats={stats} />
          </div>
        </section>

        <section className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-linear-to-r from-[#1e2a5e] to-[#7f1d1d] px-5 py-6 text-center text-white sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm">আপনার জেলায় রক্তদাতা কম? নিজে যুক্ত হয়ে অন্যদেরও জানান।</p>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <UserPlus className="h-4 w-4" />
            রক্তদাতা হিসেবে যুক্ত হোন
          </Link>
        </section>
      </div>
    </main>
  );
}
