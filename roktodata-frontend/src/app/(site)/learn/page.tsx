import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Bug, Droplet, HeartHandshake, Search, TriangleAlert } from "lucide-react";
import { ArticleCard } from "@/components/learn/ArticleParts";
import JsonLd from "@/components/JsonLd";
import { toBanglaNumber } from "@/lib/data";
import { ARTICLES, articlesIn, CATEGORIES, type Category } from "@/lib/articles";
import { pageMetadata, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "জানুন: রক্তদান ও ডেঙ্গু নিয়ে যা জানা জরুরি | রক্তদাতা",
  description:
    "ডেঙ্গুতে প্লাটিলেট কত হলে রক্ত লাগে, ডেঙ্গুর বিপদচিহ্ন, কে রক্ত দিতে পারবেন, কতদিন পর পর রক্ত দেওয়া যায়: সহজ বাংলায় দরকারি লেখা।",
  path: "/learn",
});

const FEATURED = "dengue-platelet-count";
const ICON: Record<Category, typeof Bug> = { dengue: Bug, donation: Droplet };
const TONE: Record<Category, string> = { dengue: "bg-amber-100 text-amber-700", donation: "bg-red-100 text-red-600" };

export default function LearnPage() {
  const featured = ARTICLES.find((a) => a.slug === FEATURED)!;
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: ARTICLES.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/learn/${a.slug}`, name: a.title })),
  };

  return (
    <main className="flex-1 bg-slate-50">
      <JsonLd data={list} />
      <section className="relative overflow-hidden bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] px-4 pb-16 pt-12 text-center text-white">
        <Droplet className="absolute -left-10 top-6 h-48 w-48 rotate-[-18deg] text-white/5" fill="currentColor" />
        <Bug className="absolute -right-8 bottom-0 h-44 w-44 rotate-12 text-white/5" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-red-500/70 bg-red-950/40 px-3 py-1 text-xs text-red-100">
          <BookOpen className="h-3 w-3" />
          জানুন
        </span>
        <h1 className="relative mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-[38px]">
          রক্তদান ও ডেঙ্গু: <span className="text-red-300">যা জানা জরুরি</span>
        </h1>
        <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-200">
          জরুরি মুহূর্তে কাজে লাগে এমন তথ্য, সহজ বাংলায়। প্রতিটি লেখা মাত্র কয়েক মিনিটে পড়া যায়।
        </p>
        <nav aria-label="বিষয়" className="relative mt-6 flex flex-wrap justify-center gap-2">
          {(Object.keys(CATEGORIES) as Category[]).map((c) => {
            const Icon = ICON[c];
            return (
              <a
                key={c}
                href={`#${c}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/20 transition hover:bg-white hover:text-slate-900"
              >
                <Icon className="h-4 w-4" />
                {CATEGORIES[c].label}
                <span className="rounded-full bg-white/20 px-1.5 text-xs">{toBanglaNumber(articlesIn(c).length)}</span>
              </a>
            );
          })}
        </nav>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* the dengue alert, then the most needed article */}
        <Link
          href="/learn/dengue-warning-signs"
          className="group relative -mt-7 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-lg transition hover:border-amber-400 sm:mx-auto sm:max-w-2xl"
        >
          <span className="flex h-10 w-10 shrink-0 animate-pulse items-center justify-center rounded-full bg-amber-500 text-white">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <span className="flex-1 text-sm leading-6 text-amber-950">
            <strong>ডেঙ্গুর মৌসুমে সতর্ক থাকুন।</strong> জ্বর কমে যাওয়ার পরের দিনগুলোই সবচেয়ে ঝুঁকির।{" "}
            <span className="font-semibold text-amber-800 underline underline-offset-4">বিপদচিহ্নগুলো দেখুন</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-amber-700 transition-transform group-hover:translate-x-1" />
        </Link>

        <div className="mt-10">
          <ArticleCard article={featured} featured />
        </div>

        {(Object.keys(CATEGORIES) as Category[]).map((c) => {
          const Icon = ICON[c];
          const items = articlesIn(c).filter((a) => a.slug !== FEATURED);
          return (
            <section key={c} id={c} className="scroll-mt-24 pt-14">
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE[c]}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{CATEGORIES[c].title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{CATEGORIES[c].text}</p>
                </div>
              </div>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <li key={a.slug}>
                    <ArticleCard article={a} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <section className="my-14 overflow-hidden rounded-2xl bg-linear-to-r from-red-600 to-rose-700 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">জরুরি রক্ত দরকার?</h2>
              <p className="mt-1 text-sm text-red-100">জেলা আর রক্তের গ্রুপ দিয়ে খুঁজুন, প্রস্তুত ডোনারকে সরাসরি ফোন করুন। সম্পূর্ণ বিনামূল্যে।</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/find-donor" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-50">
                <Search className="h-4 w-4" />
                ডোনার খুঁজুন
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white ring-1 ring-white/60 hover:bg-white/10">
                <HeartHandshake className="h-4 w-4" />
                রক্তদাতা হোন
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
