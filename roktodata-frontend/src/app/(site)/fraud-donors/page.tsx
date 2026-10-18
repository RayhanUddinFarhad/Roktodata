import type { Metadata } from "next";
import FraudDonors from "@/components/FraudDonors";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "প্রতারক ডোনার তালিকা | রক্তদাতা",
  description:
    "রক্তদানের নামে প্রতারণা করা নাম্বারের যাচাইকৃত তালিকা। নাম্বার দিয়ে যাচাই করুন বা প্রতারকের তথ্য দিন।",
  path: "/fraud-donors",
});

export default function FraudDonorsPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <FraudDonors />
      </div>
    </main>
  );
}
