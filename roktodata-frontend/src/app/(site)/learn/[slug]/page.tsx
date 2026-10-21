import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, ChevronRight, Clock, HeartHandshake, ListOrdered, Phone, Search, Stethoscope } from "lucide-react";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { ArticleBlock, ArticleCard, ICONS } from "@/components/learn/ArticleParts";
import ReadingProgress from "@/components/learn/ReadingProgress";
import { toBanglaNumber } from "@/lib/data";
import { ARTICLES, articleDate, CATEGORIES, getArticle, readingMinutes } from "@/lib/articles";
import { pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const article = getArticle((await params).slug);
  if (!article) return {};
  return pageMetadata({ title: `${article.title} | রক্তদাতা`, description: article.description, path: `/learn/${article.slug}` });
}

export default async function ArticlePage({ params }: PageProps<"/learn/[slug]">) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const Icon = ICONS[article.icon];
  const url = `${SITE_URL}/learn/${article.slug}`;
  const minutes = toBanglaNumber(readingMinutes(article));
  // Same topic first, then the other topic.
  const related = [...ARTICLES.filter((a) => a.category === article.category), ...ARTICLES.filter((a) => a.category !== article.category)]
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      inLanguage: "bn",
      datePublished: article.published,
      dateModified: article.updated,
      mainEntityOfPage: url,
      image: `${SITE_URL}/og-image.png`,
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "জানুন", item: `${SITE_URL}/learn` },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
    },
  ];

  return (
    <main className="flex-1 bg-slate-50">
      <ReadingProgress />
      {jsonLd.map((d) => (
        <JsonLd key={d["@type"]} data={d} />
      ))}

      <header className={`relative overflow-hidden bg-linear-to-br ${article.tone} px-4 pb-20 pt-8 text-white`}>
        <Icon className="absolute -right-10 -top-6 h-64 w-64 text-white/10" strokeWidth={1.25} />
        <div className="relative mx-auto max-w-3xl">
          <nav aria-label="অবস্থান" className="flex flex-wrap items-center gap-1 text-xs text-white/80">
            <Link href="/" className="hover:text-white">
              হোম
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/learn" className="hover:text-white">
              জানুন
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/learn#${article.category}`} className="hover:text-white">
              {CATEGORIES[article.category].label}
            </Link>
          </nav>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Icon className="h-3.5 w-3.5" />
            {CATEGORIES[article.category].label}
          </span>
          <h1 className="mt-3 text-[26px] font-bold leading-tight sm:text-4xl">{article.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">{article.description}</p>
          <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {minutes} মিনিটে পড়ুন
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              হালনাগাদ: {articleDate(article.updated)}
            </span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        {/* at a glance */}
        <section className="relative -mt-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
          <div className="flex items-center gap-4">
            <div className={`shrink-0 rounded-xl bg-linear-to-br ${article.tone} px-4 py-3 text-center text-white`}>
              <p className="text-xl font-bold leading-none sm:text-2xl">{article.hook.value}</p>
            </div>
            <p className="text-sm font-semibold leading-6 text-slate-700">{article.hook.label}</p>
          </div>
          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-red-600">এক নজরে</h2>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {article.facts.map((f) => (
              <li key={f} className="flex gap-2 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {f}
              </li>
            ))}
          </ul>
        </section>

        {/* contents */}
        <nav aria-label="সূচিপত্র" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ListOrdered className="h-4 w-4 text-red-600" />
            এই লেখায় যা আছে
          </p>
          <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {article.sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 group-hover:bg-red-600 group-hover:text-white">
                    {toBanglaNumber(i + 1)}
                  </span>
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="mt-6 space-y-6">
          {article.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="flex items-start gap-3 text-xl font-bold leading-snug text-slate-900">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${article.tone} text-sm text-white`}>
                  {toBanglaNumber(i + 1)}
                </span>
                {s.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {s.blocks.map((b, j) => (
                  <ArticleBlock key={j} block={b} />
                ))}
              </div>
            </section>
          ))}
        </article>

        <aside className="mt-6 flex gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-xs leading-6 text-slate-600">
          <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <p>
            এই লেখা সাধারণ সচেতনতার জন্য, চিকিৎসকের পরামর্শের বিকল্প নয়। রোগীর চিকিৎসা, রক্ত বা প্লাটিলেট দেওয়ার সিদ্ধান্ত চিকিৎসক নেবেন। স্বাস্থ্য
            পরামর্শের জন্য সরকারি স্বাস্থ্য বাতায়নে ফোন করুন:{" "}
            <a href="tel:16263" className="inline-flex items-center gap-1 font-bold text-slate-900">
              <Phone className="h-3 w-3" />
              ১৬২৬৩
            </a>
          </p>
        </aside>

        <section className="mt-6 overflow-hidden rounded-2xl bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] p-6 text-white shadow-lg">
          {article.cta === "find" ? (
            <>
              <h2 className="text-xl font-bold">রক্ত বা প্লাটিলেট দরকার?</h2>
              <p className="mt-1 text-sm text-slate-200">জেলা আর রক্তের গ্রুপ দিয়ে খুঁজুন, প্রস্তুত ডোনারকে সরাসরি ফোন করুন। না পেলে অনুরোধ দিন, সাথে সাথে পোস্টার পাবেন।</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link href="/find-donor" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500">
                  <Search className="h-4 w-4" />
                  ডোনার খুঁজুন
                </Link>
                <Link href="/patient-search" className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold ring-1 ring-white/50 hover:bg-white/10">
                  রক্তের অনুরোধ করুন
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">আপনার রক্তে বাঁচতে পারে একটি প্রাণ</h2>
              <p className="mt-1 text-sm text-slate-200">রক্তদাতা হিসেবে যুক্ত হলে আপনার এলাকায় কারো রক্ত লাগলে তাঁরা আপনাকে খুঁজে পাবেন। সম্পূর্ণ বিনামূল্যে।</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500">
                  <HeartHandshake className="h-4 w-4" />
                  রক্তদাতা হোন
                </Link>
                <Link href="/find-donor" className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold ring-1 ring-white/50 hover:bg-white/10">
                  ডোনার খুঁজুন
                </Link>
              </div>
            </>
          )}
        </section>

        <div className="mt-6">
          <Faq title="সাধারণ প্রশ্ন" items={article.faq} />
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-12">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">আরও পড়ুন</h2>
          <Link href="/learn" className="text-sm font-semibold text-red-600 hover:text-red-700">
            সব লেখা →
          </Link>
        </div>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((a) => (
            <li key={a.slug}>
              <ArticleCard article={a} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
