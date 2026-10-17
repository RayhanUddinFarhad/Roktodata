import type { Metadata } from "next";
import { Suspense } from "react";
import DonorSearch from "@/components/DonorSearch";

export const metadata: Metadata = {
  title: "ডোনার খুঁজুন | রক্তদাতা",
};

export default function FindDonorPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <Suspense>
          <DonorSearch />
        </Suspense>
      </div>
    </main>
  );
}
