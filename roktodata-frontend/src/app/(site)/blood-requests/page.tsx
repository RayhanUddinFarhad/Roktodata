import type { Metadata } from "next";
import BloodRequestsFeed from "@/components/BloodRequestsFeed";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "রক্তের অনুরোধ | রক্তদাতা",
  description:
    "যাঁদের রক্ত প্রয়োজন, তাঁদের যাচাইকৃত অনুরোধ। রক্ত দিতে পারলে সরাসরি যোগাযোগ করুন।",
  path: "/blood-requests",
});

export default function BloodRequestsPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <BloodRequestsFeed />
      </div>
    </main>
  );
}
