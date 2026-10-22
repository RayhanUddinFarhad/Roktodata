"use client";

import { useState, useSyncExternalStore } from "react";
import { BellRing, CircleCheck, Loader2 } from "lucide-react";
import { canOfferPush, dismissPushOffer } from "@/lib/pushOffer";

const noSubscribe = () => () => {};

// An inline "turn on notifications" card for a page where they clearly help (the blood request
// feed, a donor's saved registration). Shows nothing where they can't be offered.
export default function PushOfferCard({
  title,
  text,
  onEnabled,
  className = "",
}: {
  title: string;
  text: string;
  // Called with this device's notification address once they are on.
  onEnabled?: (endpoint: string) => Promise<void> | void;
  className?: string;
}) {
  const offerable = useSyncExternalStore(noSubscribe, canOfferPush, () => false);
  const [state, setState] = useState<"ask" | "busy" | "on" | "hidden" | "error">("ask");

  if (!offerable || state === "hidden") return null;

  async function enable() {
    setState("busy");
    try {
      const push = await import("@/lib/push");
      const result = await push.enablePush();
      if (!result) return setState("hidden");
      const endpoint = await push.pushEndpoint();
      if (endpoint) await onEnabled?.(endpoint);
      setState("on");
    } catch {
      setState("error");
    }
  }

  if (state === "on") {
    return (
      <p className={`flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ${className}`}>
        <CircleCheck className="h-5 w-5 shrink-0" />
        নোটিফিকেশন চালু হয়েছে।
      </p>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-red-600 shadow-sm">
        <BellRing className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs leading-relaxed text-slate-600">{state === "error" ? "চালু করা যায়নি। একটু পরে আবার চেষ্টা করুন।" : text}</p>
      </div>
      <div className="flex w-full gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() => {
            dismissPushOffer();
            setState("hidden");
          }}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white sm:flex-none"
        >
          পরে
        </button>
        <button
          type="button"
          onClick={enable}
          disabled={state === "busy"}
          className="flex flex-2 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60 sm:flex-none"
        >
          {state === "busy" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
          চালু করুন
        </button>
      </div>
    </div>
  );
}
