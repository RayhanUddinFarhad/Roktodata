import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import AssistantChat from "@/components/assistant/AssistantChat";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "রক্তদাতা সহকারী (এআই) | রক্তদান ও ডোনার খোঁজার প্রশ্ন",
  description:
    "রক্তদাতার এআই সহকারীকে বাংলায় প্রশ্ন করুন: কোথায় ডোনার পাবেন, আবার কবে রক্ত দিতে পারবেন, কে কাকে রক্ত দিতে পারে, ডেঙ্গুতে প্লাটিলেট। উত্তর আসে রক্তদাতার নিজের লেখা থেকে।",
  path: "/assistant",
});

export default function AssistantPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto flex max-w-[760px] flex-col px-4 py-6">
        <header className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-lg shadow-red-600/25">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">রক্তদাতা সহকারী</h1>
            <p className="text-xs text-slate-500">এআই-চালিত সাহায্য: ডোনার খোঁজা, রক্তদানের নিয়ম, ডেঙ্গু ও প্লাটিলেট</p>
          </div>
        </header>
        <div className="mt-4 h-[min(720px,calc(100dvh-11rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <AssistantChat />
        </div>
      </div>
    </main>
  );
}
