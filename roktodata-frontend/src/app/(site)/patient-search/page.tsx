import type { Metadata } from "next";
import PatientSearch from "@/components/PatientSearch";

export const metadata: Metadata = {
  title: "রোগীর তথ্য দিয়ে খুঁজুন | রক্তদাতা",
};

export default function PatientSearchPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <PatientSearch />
      </div>
    </main>
  );
}
