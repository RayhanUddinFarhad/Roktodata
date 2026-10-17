import type { Metadata } from "next";
import DonorRegisterForm from "@/components/DonorRegisterForm";

export const metadata: Metadata = {
  title: "ডোনার রেজিস্ট্রেশন | রক্তদাতা",
};

export default function RegisterPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[440px] px-4 py-8">
        <DonorRegisterForm />
      </div>
    </main>
  );
}
