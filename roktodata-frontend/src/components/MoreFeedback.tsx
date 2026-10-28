"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import FeedbackCard from "@/components/FeedbackCard";
import { ApiError, getFeedback } from "@/lib/api";
import type { Feedback } from "@/lib/data";

// "আরও দেখুন" under the first page of feedback (which the server already rendered).
export default function MoreFeedback({ pageSize, total }: { pageSize: number; total: number }) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMore() {
    setLoading(true);
    setError("");
    try {
      const result = await getFeedback(page + 1, pageSize);
      setItems((current) => [...current, ...result.feedback]);
      setPage(page + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "লোড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {items.length > 0 && (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <FeedbackCard feedback={item} />
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-4 text-center text-xs text-red-600">{error}</p>}
      {page * pageSize < total && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            আরও দেখুন
          </button>
        </div>
      )}
    </>
  );
}
