import type { Metadata } from "next";
import { Suspense } from "react";
import DonorSearch from "@/components/DonorSearch";
import DonorSearchSkeleton from "@/components/DonorSearchSkeleton";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "রক্তের ডোনার খুঁজুন | Find Blood Donor | রক্তদাতা",
  description:
    "A+, B+, O+, AB+ সহ সব রক্তের গ্রুপের রক্তদাতা খুঁজুন জেলা ও থানা অনুযায়ী। যাঁরা এখন রক্ত দিতে পারবেন, শুধু তাঁদেরই দেখানো হয়।",
  path: "/find-donor",
});

export default function FindDonorPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <Suspense fallback={<DonorSearchSkeleton />}>
          <DonorSearch />
        </Suspense>
      </div>
    </main>
  );
}
