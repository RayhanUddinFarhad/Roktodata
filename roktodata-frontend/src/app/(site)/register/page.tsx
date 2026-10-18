import type { Metadata } from "next";
import DonorRegisterForm from "@/components/DonorRegisterForm";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "ডোনার রেজিস্ট্রেশন | রক্তদাতা",
  description:
    "রক্তদাতা হিসেবে বিনামূল্যে রেজিস্ট্রেশন করুন বা আপনার তথ্য আপডেট করুন। মোবাইল নাম্বার SMS কোড দিয়ে যাচাই করা হয়।",
  path: "/register",
});

export default function RegisterPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[440px] px-4 py-8">
        <DonorRegisterForm />
      </div>
    </main>
  );
}
