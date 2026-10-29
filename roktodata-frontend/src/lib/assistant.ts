import { API_URL, ApiError } from "@/lib/api";
import type { Donor } from "@/lib/data";

// The AI assistant ("রক্তদাতা সহকারী"): the conversation lives in the browser; each question sends the
// visible text so far and the answer streams back as server-sent events.

export type AssistantCard =
  | { type: "donors"; bloodGroup: string; district: string; upazila: string; total: number; donors: Donor[] }
  | {
      type: "requests";
      requests: { id: string; bloodGroup: string; bags: number; district: string; upazila: string; hospital: string; neededDate: string | null; phone: string }[];
    };

export type AssistantEvent =
  | { type: "text"; text: string }
  | { type: "card"; card: AssistantCard }
  | { type: "done" }
  | { type: "error"; message: string };

export interface AssistantMessage {
  role: "user" | "assistant";
  text: string;
  cards?: AssistantCard[];
  error?: string;
}

// The server takes at most this many turns, starting with the visitor's.
const MAX_TURNS = 12;

export async function askAssistant(history: AssistantMessage[], onEvent: (event: AssistantEvent) => void, signal?: AbortSignal) {
  let turns = history.filter((m) => m.text.trim() && !m.error).map(({ role, text }) => ({ role, text }));
  turns = turns.slice(-MAX_TURNS);
  while (turns.length && turns[0].role !== "user") turns.shift();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: turns }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError("ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।");
  }
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.message ?? "সহকারী এখন উত্তর দিতে পারছে না। একটু পরে আবার চেষ্টা করুন।", res.status, data?.code);
  }

  // Events are "data: {json}" lines separated by a blank line; a read can end mid-event.
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 2);
      if (line.startsWith("data: ")) onEvent(JSON.parse(line.slice(6)) as AssistantEvent);
    }
  }
}
