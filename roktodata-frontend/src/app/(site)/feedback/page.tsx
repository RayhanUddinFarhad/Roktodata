import type { Metadata } from "next";
import { MessageSquareHeart } from "lucide-react";
import FeedbackButton from "@/components/FeedbackButton";
import FeedbackCard from "@/components/FeedbackCard";
import MoreFeedback from "@/components/MoreFeedback";
import { toBanglaNumber } from "@/lib/data";
import { getLatestFeedback } from "@/lib/feedback";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "ফিডব্যাক ও অভিজ্ঞতা | রক্তদাতা",
  description: "রক্তদাতা থেকে রক্ত পেয়েছেন বা রক্ত দিয়েছেন, এমন মানুষের নিজের অভিজ্ঞতা। আপনার অভিজ্ঞতাও লিখুন।",
  path: "/feedback",
});

const PAGE_SIZE = 12;

export default async function FeedbackPage() {
  const { feedback, total } = await getLatestFeedback(PAGE_SIZE);
  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <header className="rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 px-5 py-7 text-center text-white shadow-lg shadow-red-600/20">
          <MessageSquareHeart className="mx-auto h-9 w-9 text-white/90" />
          <h1 className="mt-2 text-2xl font-bold">যাঁরা উপকৃত হয়েছেন</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
            রক্তদাতা কাজে লেগেছে? আপনার অভিজ্ঞতা লিখুন। আপনার দুই লাইন জরুরি মুহূর্তে অন্য কাউকে ভরসা দেবে।
          </p>
          <FeedbackButton className="mt-5 bg-white !text-red-700 shadow-none hover:bg-red-50" />
        </header>

        {feedback.length > 0 ? (
          <>
            <p className="mt-6 text-sm text-slate-500">মোট {toBanglaNumber(total)}টি ফিডব্যাক</p>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              {feedback.map((item) => (
                <li key={item.id}>
                  <FeedbackCard feedback={item} />
                </li>
              ))}
            </ul>
            <MoreFeedback pageSize={PAGE_SIZE} total={total} />
          </>
        ) : (
          <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            এখনো কোনো ফিডব্যাক প্রকাশ হয়নি। প্রথম অভিজ্ঞতাটি আপনিই লিখুন।
          </p>
        )}
      </div>
    </main>
  );
}
