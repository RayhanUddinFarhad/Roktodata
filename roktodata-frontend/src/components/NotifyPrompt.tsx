"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, CircleCheck, Loader2, X } from "lucide-react";
import { enablePush } from "@/lib/push";

// The card the installed app shows until notifications are on (or the visitor says "পরে").
export default function NotifyPrompt({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<"ask" | "busy" | "on" | "error">("ask");
  const [area, setArea] = useState<string | null>(null);

  async function enable() {
    setState("busy");
    try {
      const result = await enablePush();
      if (!result) return onClose();
      setArea(result.district);
      setState("on");
      setTimeout(onClose, 6000);
    } catch {
      setState("error");
    }
  }

  return (
    <div role="dialog" aria-label="নোটিফিকেশন" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20">
        <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="absolute right-2 top-2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
        {state === "on" ? (
          <div className="flex gap-3 pr-6">
            <CircleCheck className="h-6 w-6 shrink-0 text-emerald-600" />
            <p className="text-sm leading-relaxed text-slate-700">
              নোটিফিকেশন চালু হয়েছে।{" "}
              {area ? `${area} ও আশেপাশে কারো রক্ত লাগলে জানিয়ে দেব।` : "কাছাকাছি কারো রক্ত লাগলে জানিয়ে দেব।"}{" "}
              <Link href="/app" onClick={onClose} className="font-semibold text-red-600">
                এলাকা বদলান
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 pr-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <BellRing className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-slate-900">কাছাকাছি কারো রক্ত লাগলে জানুন</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {state === "error" ? "চালু করা যায়নি। একটু পরে আবার চেষ্টা করুন।" : "আপনার এলাকায় জরুরি রক্তের অনুরোধ এলে নোটিফিকেশন পাবেন। দিনে সর্বোচ্চ ৩টি।"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                পরে
              </button>
              <button
                type="button"
                onClick={enable}
                disabled={state === "busy"}
                className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                নোটিফিকেশন চালু করুন
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
