import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  Cake,
  HandHeart,
  HeartPulse,
  RefreshCw,
  Scale,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/home/HowItWorks";

const BENEFITS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: HeartPulse,
    title: "একাধিক প্রাণ বাঁচে",
    text: "এক ব্যাগ রক্ত থেকে তৈরি উপাদান দিয়ে একাধিক রোগীর চিকিৎসা করা সম্ভব।",
  },
  {
    icon: Stethoscope,
    title: "বিনামূল্যে স্বাস্থ্য পরীক্ষা",
    text: "রক্তদানের আগে রক্তচাপ, হিমোগ্লোবিন ও রক্তবাহিত কয়েকটি রোগের পরীক্ষা হয়ে যায়।",
  },
  {
    icon: RefreshCw,
    title: "নতুন রক্তকণিকা তৈরি হয়",
    text: "রক্তদানের পর শরীর স্বাভাবিকভাবেই নতুন রক্তকণিকা তৈরি করে ঘাটতি পূরণ করে নেয়।",
  },
  {
    icon: HandHeart,
    title: "মানসিক প্রশান্তি",
    text: "কারো জীবন বাঁচাতে পাশে দাঁড়ানোর আনন্দ ও তৃপ্তি অন্য কিছুতে পাওয়া যায় না।",
  },
];

const ELIGIBILITY: { icon: LucideIcon; text: string }[] = [
  { icon: Cake, text: "বয়স ১৮ থেকে ৬০ বছর" },
  { icon: Scale, text: "ওজন ৫০ কেজি বা তার বেশি" },
  { icon: CalendarCheck, text: "শেষ রক্তদানের পর অন্তত ৩ মাস পার হয়েছে" },
  { icon: BadgeCheck, text: "সুস্থ আছেন, জ্বর বা সংক্রমণ নেই" },
];

export default function DonationBenefits() {
  return (
    <section className="bg-slate-50 px-4 py-14">
      <div className="mx-auto max-w-[808px]">
        <SectionHeading
          eyebrow="রক্তদান কেন"
          title="রক্তদানের উপকারিতা"
          text="রক্তদান শুধু অন্যের জীবন বাঁচায় না, রক্তদাতার নিজের জন্যও এটি উপকারী।"
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_17rem]">
          <ul className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <aside className="flex flex-col rounded-xl bg-linear-to-b from-[#1e2a5e] to-[#15172b] p-5 text-white shadow-md">
            <h3 className="font-bold">কারা রক্ত দিতে পারবেন</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {ELIGIBILITY.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                  <span className="text-slate-100">{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
              কোনো অসুস্থতা বা নিয়মিত ওষুধ থাকলে রক্তদানের আগে চিকিৎসকের পরামর্শ নিন।
            </p>
            <Link
              href="/register"
              className="mt-5 block rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-red-700"
            >
              রক্তদাতা হিসেবে যুক্ত হোন
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
