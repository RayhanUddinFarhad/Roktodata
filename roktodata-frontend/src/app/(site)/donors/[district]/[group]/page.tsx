import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, Droplet, MapPin } from "lucide-react";
import DonorSearch from "@/components/DonorSearch";
import DonorSearchSkeleton from "@/components/DonorSearchSkeleton";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { BLOOD_GROUPS, DISTRICTS, toBanglaNumber } from "@/lib/data";
import {
  districtEnglish,
  districtEnglishShort,
  districtFromSlug,
  districtSlug,
  districtSlugs,
  groupBangla,
  groupEnglish,
  groupFromSlug,
  groupSlug,
  groupSlugs,
  pageMetadata,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import { districtStats, getDonorStats } from "@/lib/stats";

// One page per district and blood group ("O+ blood donor in Chittagong"): 64 x 8 pages.
export function generateStaticParams() {
  return districtSlugs().flatMap((district) => groupSlugs().map((group) => ({ district, group })));
}

async function resolve(params: PageProps<"/donors/[district]/[group]">["params"]) {
  const { district: slug, group: gSlug } = await params;
  const district = districtFromSlug(slug);
  const group = groupFromSlug(gSlug);
  return district && group ? { slug, gSlug, district, group } : null;
}

export async function generateMetadata({ params }: PageProps<"/donors/[district]/[group]">): Promise<Metadata> {
  const page = await resolve(params);
  if (!page) return {};
  const { slug, gSlug, district, group } = page;
  const stats = await getDonorStats();
  const count = districtStats(stats, district).groups[group] ?? 0;
  return pageMetadata({
    title: `${district} জেলার ${group} রক্তের ডোনার | ${group} Blood Donor in ${districtEnglishShort(slug)}`,
    description: `${district} জেলায় ${group} (${groupBangla(group)}) রক্তের ডোনার খুঁজুন থানা অনুযায়ী এবং সরাসরি ফোন করুন, বিনামূল্যে। Find ${group} (${groupEnglish(group)}) blood donors in ${districtEnglish(slug)}.`,
    path: `/donors/${slug}/${gSlug}`,
    // Without donors of this group the page would be empty in search results.
    noindex: stats.available && count === 0,
  });
}

export default async function DistrictGroupPage({ params }: PageProps<"/donors/[district]/[group]">) {
  const page = await resolve(params);
  if (!page) notFound();
  const { slug, gSlug, district, group } = page;

  const stats = await getDonorStats();
  const { groups } = districtStats(stats, district);
  const count = groups[group] ?? 0;
  const en = districtEnglish(slug);

  // The same blood group elsewhere, most donors first.
  const elsewhere = DISTRICTS.filter((d) => d !== district)
    .map((d) => ({ district: d, count: stats.byDistrict[d]?.groups[group] ?? 0 }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "জেলাভিত্তিক রক্তদাতা", item: `${SITE_URL}/donors` },
      { "@type": "ListItem", position: 3, name: district, item: `${SITE_URL}/donors/${slug}` },
      { "@type": "ListItem", position: 4, name: `${group} রক্তদাতা`, item: `${SITE_URL}/donors/${slug}/${gSlug}` },
    ],
  };

  const faq = [
    {
      question: `${district} জেলায় ${group} রক্ত জরুরি দরকার, ডোনার কীভাবে পাব?`,
      answer: `উপরের তালিকায় ${district} জেলার ${group} রক্তদাতারা আছেন। থানা বেছে নিয়ে কাছের রক্তদাতাকে "কল করুন" চেপে সরাসরি ফোন করুন। কাউকে না পেলে "রোগীর তথ্য দিয়ে খুঁজুন" পাতায় অনুরোধ দিন।`,
    },
    {
      question: `Where can I find ${group} (${groupEnglish(group)}) blood donors in ${districtEnglishShort(slug)}?`,
      answer: `This page lists ${group} donors in ${en} who can donate now${count > 0 ? ` (${count} right now)` : ""}. Choose a thana to narrow the list and call a donor directly. It is free.`,
    },
    {
      question: "রক্তদাতার সাথে যোগাযোগ করতে কি টাকা লাগে?",
      answer: `না, রক্তদাতা সম্পূর্ণ বিনামূল্যে। কেউ রক্ত দেওয়ার বিনিময়ে টাকা চাইলে "প্রতারক ডোনার" পাতায় নাম্বারটি যাচাই করুন এবং রিপোর্ট করুন।`,
    },
  ];

  return (
    <main className="flex-1 bg-slate-50">
      <JsonLd data={breadcrumb} />
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <nav aria-label="অবস্থান" className="mb-3 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
          <Link href="/" className="hover:text-red-600">
            হোম
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/donors" className="hover:text-red-600">
            জেলাভিত্তিক রক্তদাতা
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/donors/${slug}`} className="hover:text-red-600">
            {district}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-slate-700">{group}</span>
        </nav>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-0.5 text-[11px] font-semibold text-red-700">
            <MapPin className="h-3 w-3" />
            {district} জেলা
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {district} জেলার {group} রক্তের ডোনার
          </h1>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            {group} ({groupEnglish(group)}) blood donors in {en}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {!stats.available ? (
              <>
                {district} জেলার {group} ({groupBangla(group)}) রক্তদাতাদের তালিকা নিচে। থানা বেছে নিয়ে সরাসরি ফোন করুন।
              </>
            ) : count > 0 ? (
              <>
                {district} জেলায় এখন <strong className="text-slate-900">{toBanglaNumber(count)} জন</strong> {group} (
                {groupBangla(group)}) রক্তদাতা রক্ত দিতে প্রস্তুত। থানা বেছে নিয়ে কাছের রক্তদাতাকে সরাসরি ফোন করুন।
              </>
            ) : (
              <>
                {district} জেলায় এই মুহূর্তে {group} রক্ত দিতে প্রস্তুত কোনো রক্তদাতা নেই। নিচে পাশের জেলাগুলোতে খুঁজুন,
                অথবা রোগীর তথ্য দিয়ে অনুরোধ করুন।
              </>
            )}
          </p>

          <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
            {BLOOD_GROUPS.map((g) => {
              const active = g === group;
              return (
                <li key={g}>
                  <Link
                    href={`/donors/${slug}/${groupSlug(g)}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex flex-col items-center rounded-lg border py-2 ${
                      active ? "border-red-600 bg-red-600 text-white" : "border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <span className={`text-sm font-bold ${active ? "text-white" : "text-red-600"}`}>{g}</span>
                    <span className={`font-mono text-[11px] ${active ? "text-white" : "text-slate-500"}`}>
                      {toBanglaNumber(groups[g] ?? 0)} জন
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-6">
          <Suspense fallback={<DonorSearchSkeleton />}>
            <DonorSearch defaultDistrict={district} defaultBloodGroup={group} headingLevel="h2" />
          </Suspense>
        </div>

        {elsewhere.length > 0 && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <Droplet className="h-5 w-5 text-red-600" fill="currentColor" />
              অন্য জেলায় {group} রক্তদাতা
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {elsewhere.map((d) => (
                <li key={d.district}>
                  <Link
                    href={`/donors/${districtSlug(d.district)}/${gSlug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-red-300 hover:text-red-600"
                  >
                    {d.district}
                    <span className="font-mono text-[11px] text-slate-500">{toBanglaNumber(d.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-6">
          <Faq title={`${district} জেলায় ${group} রক্ত: সাধারণ প্রশ্ন`} items={faq} />
        </div>
      </div>
    </main>
  );
}
