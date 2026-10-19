import Link from "next/link";
import { BadgeCheck, Crosshair, Megaphone, PhoneCall, Search, ShieldCheck, Zap, type LucideIcon } from "lucide-react";

// What makes it easy, shown under the steps.
const PERKS: { icon: LucideIcon; text: string }[] = [
  { icon: Zap, text: "লগইন ছাড়াই, সাথে সাথে" },
  { icon: Crosshair, text: "জেলা ও থানা পর্যন্ত ফিল্টার" },
  { icon: BadgeCheck, text: "শুধু রক্ত দিতে প্রস্তুত ডোনার" },
  { icon: ShieldCheck, text: "সম্পূর্ণ বিনামূল্যে" },
];

const STEPS: { icon: LucideIcon; title: string; text: string; href: string; cta: string }[] = [
  {
    icon: Search,
    title: "রক্তদাতা খুঁজুন",
    text: "রক্তের গ্রুপ, জেলা ও থানা বেছে নিন। শুধু রক্ত দিতে প্রস্তুত ডোনারদের তালিকা দেখতে পাবেন।",
    href: "/find-donor",
    cta: "ডোনার খুঁজুন",
  },
  {
    icon: PhoneCall,
    title: "সরাসরি কল করুন",
    text: "তালিকা থেকে ডোনারকে সরাসরি ফোন করে জেনে নিন তিনি এখন রক্ত দিতে পারবেন কিনা।",
    href: "/find-donor",
    cta: "তালিকা দেখুন",
  },
  {
    icon: Megaphone,
    title: "অনুরোধ পোস্ট করুন",
    text: "ডোনার না পেলে রোগীর তথ্য দিন। যাচাইয়ের পর অনুরোধটি পোস্ট হবে, ডোনাররাই আপনাকে ফোন করবেন।",
    href: "/patient-search",
    cta: "অনুরোধ করুন",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white px-4 py-14">
      <div className="mx-auto max-w-[808px]">
        <SectionHeading eyebrow="সহজ তিন ধাপ" title="কীভাবে রক্ত খুঁজবেন" />
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text, href, cta }, index) => (
            <li key={title} className="relative rounded-xl border border-slate-100 bg-slate-50 p-6">
              <span className="absolute right-5 top-4 text-4xl font-bold text-slate-200" aria-hidden>
                {["১", "২", "৩"][index]}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-600 text-white shadow-md shadow-red-600/30">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              <Link href={href} className="mt-3 inline-block text-sm font-semibold text-red-600 hover:underline">
                {cta} →
              </Link>
            </li>
          ))}
        </ol>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              <Icon className="h-3.5 w-3.5" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// Shared centered heading for homepage sections.
export function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="text-center">
      <span className="text-xs font-semibold uppercase tracking-wider text-red-600">{eyebrow}</span>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
      {text && <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{text}</p>}
    </div>
  );
}
