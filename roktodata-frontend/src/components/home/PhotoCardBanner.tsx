import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Invitation under the hero to make a "আমি যতবার রক্ত দিয়েছি" photo card.
export default function PhotoCardBanner() {
  return (
    <section className="relative px-4 pb-4 pt-4">
      <Link
        href="/celebrate"
        className="group mx-auto flex max-w-[808px] items-center gap-4 overflow-hidden rounded-2xl border border-red-100 bg-linear-to-r from-[#fff1f2] via-white to-[#fef6e4] p-4 shadow-sm transition hover:shadow-md sm:gap-6 sm:p-5"
      >
        {/* four tiny cards fanned out */}
        <span className="relative hidden h-20 w-28 shrink-0 sm:block" aria-hidden>
          {[
            ["#fbf1e6", "#c81e1e", -14, 0],
            ["#fdf6e3", "#7f1d1d", -4, 18],
            ["#f6eedc", "#1e3a8a", 6, 36],
            ["#1e1b4b", "#f5c542", 16, 54],
          ].map(([bg, fg, rot, left]) => (
            <span
              key={left as number}
              className="absolute top-1 flex h-[4.5rem] w-14 items-center justify-center rounded-md border border-black/10 text-lg font-bold shadow-sm transition group-hover:-translate-y-1"
              style={{ background: bg as string, color: fg as string, transform: `rotate(${rot}deg)`, left: left as number }}
            >
              ১২
            </span>
          ))}
        </span>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-2xl sm:hidden" aria-hidden>🩸</span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-slate-900 sm:text-lg">আপনি কতবার রক্ত দিয়েছেন?</span>
          <span className="mt-0.5 block text-sm text-slate-600">নিজের রক্তদানের ফটোকার্ড বানিয়ে শেয়ার করুন</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-red-600/30 group-hover:bg-red-700">
          <span className="hidden sm:inline">কার্ড বানান</span>
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}
