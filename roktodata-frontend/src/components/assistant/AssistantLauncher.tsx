"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Maximize2, Sparkles, X } from "lucide-react";
import AssistantChat from "@/components/assistant/AssistantChat";

// The "প্রশ্ন করুন" button in the corner and the chat it opens: a sheet from the bottom on phones, a
// panel in the corner on wide screens. Never opens by itself.
export default function AssistantLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    // Phones: the sheet covers the page, so the page behind shouldn't scroll.
    const narrow = window.matchMedia("(max-width: 639px)").matches;
    const overflow = document.body.style.overflow;
    if (narrow) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-red-600 to-rose-700 py-3 pl-3.5 pr-4 text-sm font-bold text-white shadow-xl shadow-red-700/30 transition-transform hover:scale-105"
        >
          <Sparkles className="h-5 w-5" />
          প্রশ্ন করুন
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-40 sm:inset-auto sm:bottom-4 sm:right-4">
          <div className="absolute inset-0 bg-slate-900/50 sm:hidden" onClick={() => setOpen(false)} role="presentation" />
          <section
            role="dialog"
            aria-label="রক্তদাতা সহকারী"
            className="cp-up absolute inset-x-0 bottom-0 flex h-[88dvh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:static sm:h-[min(640px,calc(100dvh-2rem))] sm:w-[400px] sm:rounded-3xl sm:border sm:border-slate-200"
          >
            <header className="flex items-center gap-3 bg-gradient-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] px-4 py-3 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="flex-1 leading-tight">
                <span className="block font-bold">রক্তদাতা সহকারী</span>
                <span className="block text-[11px] text-white/70">এআই · রক্তদান, ডোনার খোঁজা, ডেঙ্গু</span>
              </span>
              <Link href="/assistant" onClick={() => setOpen(false)} aria-label="বড় করে দেখুন" title="বড় করে দেখুন" className="hidden rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white sm:block">
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => setOpen(false)} aria-label="বন্ধ করুন" className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </header>
            <AssistantChat autoFocus />
          </section>
        </div>
      )}
    </>
  );
}
