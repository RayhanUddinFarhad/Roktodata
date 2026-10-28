import Link from "next/link";
import { ArrowRight, MessageSquareHeart } from "lucide-react";
import FeedbackButton from "@/components/FeedbackButton";
import FeedbackCard from "@/components/FeedbackCard";
import { SectionHeading } from "@/components/home/HowItWorks";
import { getLatestFeedback } from "@/lib/feedback";

// "যাঁরা উপকৃত হয়েছেন": the latest approved feedback (swipe on phones), or an invitation to write the
// first one.
export default async function FeedbackSection() {
  const { feedback, total } = await getLatestFeedback(6);
  return (
    <section className="bg-gradient-to-b from-rose-50/60 to-white px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="ফিডব্যাক" title="যাঁরা উপকৃত হয়েছেন" text="রক্তদাতা থেকে রক্ত পেয়েছেন বা রক্ত দিয়েছেন, এমন মানুষের নিজের কথা।" />
        {feedback.length > 0 ? (
          <>
            <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {feedback.map((item) => (
                <li key={item.id} className="w-[85%] shrink-0 snap-center sm:w-auto">
                  <FeedbackCard feedback={item} />
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <FeedbackButton />
              {total > feedback.length && (
                <Link href="/feedback" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
                  সব ফিডব্যাক দেখুন
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </>
        ) : (
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center rounded-2xl border border-dashed border-rose-200 bg-white px-6 py-8 text-center">
            <MessageSquareHeart className="h-9 w-9 text-red-500" />
            <p className="mt-3 text-sm text-slate-600">রক্তদাতা কি আপনার কাজে লেগেছে? আপনার দুই লাইন অন্য কাউকে ভরসা দেবে।</p>
            <FeedbackButton className="mt-4" />
          </div>
        )}
      </div>
    </section>
  );
}
