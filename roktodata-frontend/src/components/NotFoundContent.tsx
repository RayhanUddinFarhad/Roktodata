import Link from "next/link";
import { ArrowRight, BookOpen, Droplet, HeartHandshake, House, Megaphone, Search, type LucideIcon } from "lucide-react";

const LINKS: { href: string; icon: LucideIcon; tone: string; title: string; text: string }[] = [
  { href: "/find-donor", icon: Search, tone: "bg-red-100 text-red-600", title: "ডোনার খুঁজুন", text: "জেলা আর রক্তের গ্রুপ দিয়ে" },
  { href: "/patient-search", icon: Megaphone, tone: "bg-amber-100 text-amber-700", title: "রক্তের অনুরোধ করুন", text: "সাথে সাথে পোস্টার পাবেন" },
  { href: "/register", icon: HeartHandshake, tone: "bg-emerald-100 text-emerald-700", title: "রক্তদাতা হোন", text: "বিনামূল্যে রেজিস্ট্রেশন" },
  { href: "/learn", icon: BookOpen, tone: "bg-indigo-100 text-indigo-800", title: "জানুন", text: "রক্তদান ও ডেঙ্গু নিয়ে" },
];

// The "page not found" screen: a friendly message and the main ways forward.
export default function NotFoundContent() {
  return (
    <main className="flex-1 bg-slate-50">
      <section className="relative overflow-hidden bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] px-4 pb-24 pt-14 text-center text-white">
        <Droplet className="absolute -left-12 top-10 h-52 w-52 -rotate-12 text-white/5" fill="currentColor" />
        <Droplet className="absolute -right-10 bottom-0 h-40 w-40 rotate-12 text-white/5" fill="currentColor" />
        <p className="relative flex items-center justify-center gap-2 text-[88px] font-bold leading-none sm:text-[120px]" aria-label="৪০৪">
          <span>৪</span>
          <span className="flex h-[0.85em] w-[0.7em] items-center justify-center">
            <Droplet className="h-full w-full animate-bounce text-red-500 drop-shadow-[0_10px_30px_rgba(239,68,68,0.5)]" fill="currentColor" strokeWidth={1} />
          </span>
          <span>৪</span>
        </p>
        <h1 className="relative mt-6 text-2xl font-bold sm:text-3xl">এই পাতাটি খুঁজে পাওয়া যায়নি</h1>
        <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-200">
          ঠিকানাটা হয়তো ভুল লেখা হয়েছে, অথবা পাতাটি সরিয়ে নেওয়া হয়েছে। তবে রক্তের প্রয়োজনে আমরা আছি, নিচের যেকোনোটি বেছে নিন।
        </p>
        <Link
          href="/"
          className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg hover:bg-red-50"
        >
          <House className="h-4 w-4" />
          হোম পেজে ফিরে যান
        </Link>
      </section>

      <ul className="relative mx-auto -mt-14 grid max-w-4xl gap-3 px-4 pb-16 sm:grid-cols-2">
        {LINKS.map(({ href, icon: Icon, tone, title, text }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-slate-900 group-hover:text-red-600">{title}</span>
                <span className="block text-xs text-slate-600">{text}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
