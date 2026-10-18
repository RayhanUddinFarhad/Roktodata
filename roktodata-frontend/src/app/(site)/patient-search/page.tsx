import type { Metadata } from "next";
import PatientSearch from "@/components/PatientSearch";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "রোগীর তথ্য দিয়ে খুঁজুন | রক্তদাতা",
  description:
    "রোগীর রক্তের গ্রুপ, জেলা ও হাসপাতালের তথ্য দিন, সাথে সাথে কাছের রক্তদাতাদের তালিকা পাবেন। অনুরোধটি যাচাই করে সবার জন্য প্রকাশ করা হবে।",
  path: "/patient-search",
});

export default function PatientSearchPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <PatientSearch />
      </div>
    </main>
  );
}
