import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Under the hero: request blood for a patient and get a ready-to-post Facebook poster.
export default function RequestPosterBanner() {
  return (
    <section className="relative px-4 pt-8">
      <Link
        href="/patient-search"
        className="group mx-auto flex max-w-[808px] items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:gap-6 sm:p-5"
      >
        {/* a tiny version of the poster */}
        <span
          aria-hidden
          className="relative flex h-24 w-[4.75rem] shrink-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white px-2 pt-2 shadow-md transition group-hover:-translate-y-1 group-hover:rotate-[-3deg]"
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-red-600" />
          <span className="mt-1 font-[Arial] text-2xl font-bold leading-none text-red-600">B+</span>
          <span className="mt-1.5 h-1 w-10 rounded bg-slate-300" />
          <span className="mt-1 h-1 w-12 rounded bg-slate-200" />
          <span className="mt-1 h-1 w-8 rounded bg-slate-200" />
          <span className="mt-auto mb-1.5 h-3 rounded-sm bg-red-50" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-slate-900 sm:text-lg">রোগীর জন্য রক্ত লাগবে?</span>
          <span className="mt-0.5 block text-sm text-slate-600">
            অনুরোধ করুন, সাথে সাথে পাবেন ফেসবুকে পোস্ট করার মতো সুন্দর পোস্টার
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#1e3a8a] px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-900/20 group-hover:bg-[#1e3070]">
          <span className="hidden sm:inline">অনুরোধ করুন</span>
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}
