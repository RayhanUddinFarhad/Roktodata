import { cacheLife } from "next/cache";
import { API_URL } from "@/lib/api";
import type { Feedback } from "@/lib/data";

// The most recently approved feedback, for the home page and the first page of /feedback. Cached
// for a few minutes so an approval shows up soon; an unreachable API just gives an empty list.
export async function getLatestFeedback(limit: number): Promise<{ feedback: Feedback[]; total: number }> {
  "use cache";
  cacheLife("minutes");
  try {
    const res = await fetch(`${API_URL}/api/feedback?limit=${limit}`, { signal: AbortSignal.timeout(60_000) });
    const data = await res.json();
    if (data?.success) return { feedback: data.feedback, total: data.total };
  } catch {
    // Falls through to the empty list.
  }
  return { feedback: [], total: 0 };
}
