import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Building2, Code2, HandHeart, Heart, Mail, Search, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/home/HowItWorks";
import developerPic from "@/lib/developer-pic.jpg";
import { CONTACT_EMAIL } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "আমাদের সম্পর্কে | রক্তদাতা",
  description:
    "রক্তদাতা কেন, কীভাবে কাজ করে এবং কে তৈরি করেছেন।",
  path: "/about",
});

const VALUES: { icon: LucideIcon; tone: string; title: string; text: string }[] = [
  {
    icon: HandHeart,
    tone: "bg-red-100 text-red-600",
    title: "সম্পূর্ণ বিনামূল্যে",
    text: "রক্তদাতা খোঁজা, অনুরোধ করা বা ডোনার হিসেবে যুক্ত হওয়া, কোনো কিছুর জন্যই টাকা লাগে না। এটি একটি অলাভজনক সামাজিক উদ্যোগ।",
  },
  {
    icon: ShieldCheck,
    tone: "bg-blue-100 text-indigo-900",
    title: "যাচাইকৃত ও নিরাপদ",
    text: "নতুন ডোনার ও রক্তের অনুরোধ অ্যাডমিন যাচাই করার পরই প্রকাশ পায়। প্রতারকদের তালিকা দিয়ে মানুষকে সতর্ক রাখা হয়।",
  },
  {
    icon: Zap,
    tone: "bg-emerald-100 text-emerald-600",
    title: "দ্রুত ও সহজ",
    text: "লগইন ছাড়াই জেলা ও থানা দিয়ে মুহূর্তেই রক্তদাতা খুঁজে সরাসরি কল করা যায়, জরুরি মুহূর্তে যেন সময় নষ্ট না হয়।",
  },
];

export default function AboutPage() {
  return (
    <main className="flex-1 bg-slate-50">
      {/* Banner */}
      <section className="bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] px-4 py-14 text-center text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/70 bg-red-950/40 px-3 py-1 text-xs text-red-100">
          <Heart className="h-3 w-3 text-pink-400" fill="currentColor" />
          আমাদের সম্পর্কে
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-[34px]">
          রক্তের প্রয়োজনে মানুষকে মানুষের কাছে পৌঁছে দেওয়া
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-200">
          রক্তদাতা একটি অলাভজনক ডিজিটাল প্ল্যাটফর্ম, যেখানে সারাদেশের স্বেচ্ছাসেবী রক্তদাতা আর রক্তের প্রয়োজনে থাকা
          মানুষ সহজে একে অপরকে খুঁজে পান।
        </p>
      </section>

      {/* Mission */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-[808px]">
          <SectionHeading
            eyebrow="আমাদের লক্ষ্য"
            title="কেন এই উদ্যোগ"
            text="জরুরি মুহূর্তে সঠিক গ্রুপের রক্তদাতা খুঁজতে গিয়ে অনেক পরিবারকে ঘণ্টার পর ঘণ্টা ফোন আর পোস্টের পেছনে ছুটতে হয়। আমরা চাই, এক জায়গা থেকেই যেন নিকটবর্তী রক্তদাতাকে খুঁজে পাওয়া যায় এবং কোনো রোগী যেন রক্তের অভাবে কষ্ট না পান।"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, tone, title, text }) => (
              <div key={title} className="rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer */}
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-[808px]">
          <SectionHeading eyebrow="যিনি তৈরি করেছেন" title="ডেভেলপার" />

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg md:grid md:grid-cols-[17rem_1fr]">
            <div className="relative aspect-[4/5] md:aspect-auto md:h-full">
              <Image
                src={developerPic}
                alt="রায়হান উদ্দিন ফরহাদ"
                fill
                placeholder="blur"
                sizes="(min-width: 768px) 272px, 100vw"
                className="object-cover object-[50%_18%]"
              />
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-8">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                <Code2 className="h-3.5 w-3.5" />
                ডেভেলপার
              </span>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">রায়হান উদ্দিন ফরহাদ</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-indigo-900">
                <Building2 className="h-4 w-4" />
                Senior Software Engineer, Ctech Inc, USA
              </p>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                রক্তদাতা প্ল্যাটফর্মটির পরিকল্পনা, ডিজাইন ও ডেভেলপমেন্ট করেছেন রায়হান উদ্দিন ফরহাদ। প্রযুক্তিকে মানুষের
                সত্যিকারের প্রয়োজনে কাজে লাগানোর লক্ষ্যে তৈরি এই প্ল্যাটফর্ম, যাতে রক্তের জন্য কাউকে অসহায় হয়ে অপেক্ষা
                করতে না হয়।
              </p>

              <ul className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {["রক্তদাতা খোঁজা ও নিবন্ধন", "রক্তের অনুরোধ ব্যবস্থাপনা", "প্রতারক শনাক্তকরণ", "অ্যাডমিন যাচাই ব্যবস্থা"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ),
                )}
              </ul>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-6 flex w-fit items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Mail className="h-4 w-4 text-red-600" />
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-[808px] rounded-2xl bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] px-6 py-10 text-center text-white shadow-xl">
          <h2 className="text-2xl font-bold">আপনিও যুক্ত হোন</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-200">
            একজন রক্তদাতা হিসেবে নিবন্ধন করুন, অথবা প্রয়োজনে এখনই রক্তদাতা খুঁজুন।
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700"
            >
              <Heart className="h-4 w-4" fill="currentColor" />
              রক্তদাতা হোন
            </Link>
            <Link
              href="/find-donor"
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              <Search className="h-4 w-4" />
              ডোনার খুঁজুন
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
