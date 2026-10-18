import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, HeartPulse, MapPin, Siren, UserPlus } from "lucide-react";
import DistrictLinks from "@/components/DistrictLinks";
import DonorSearch from "@/components/DonorSearch";
import JsonLd from "@/components/JsonLd";
import { BLOOD_GROUPS, toBanglaNumber } from "@/lib/data";
import { districtFromSlug, districtSlugs, pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import { districtStats, getDonorStats } from "@/lib/stats";

export function generateStaticParams() {
  return districtSlugs().map((district) => ({ district }));
}

export async function generateMetadata({ params }: PageProps<"/donors/[district]">): Promise<Metadata> {
  const { district: slug } = await params;
  const district = districtFromSlug(slug);
  if (!district) return {};
  return pageMetadata({
    title: `${district} জেলার রক্তদাতা | রক্তদাতা`,
    description: `${district} জেলায় A+, B+, O+, AB+ সহ সব গ্রুপের রক্তদাতা খুঁজুন থানা অনুযায়ী। যাঁরা এখন রক্ত দিতে পারবেন তাঁদের সাথে সরাসরি ফোনে যোগাযোগ করুন, বিনামূল্যে।`,
    path: `/donors/${slug}`,
  });
}

export default async function DistrictDonorsPage({ params }: PageProps<"/donors/[district]">) {
  const { district: slug } = await params;
  const district = districtFromSlug(slug);
  if (!district) notFound();

  const stats = await getDonorStats();
  const { total, groups } = districtStats(stats, district);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "জেলাভিত্তিক রক্তদাতা", item: `${SITE_URL}/donors` },
      { "@type": "ListItem", position: 3, name: district, item: `${SITE_URL}/donors/${slug}` },
    ],
  };

  return (
    <main className="flex-1 bg-slate-50">
      <JsonLd data={breadcrumb} />
      <div className="mx-auto max-w-[840px] px-4 py-8">
        <nav aria-label="অবস্থান" className="mb-3 flex items-center gap-1 text-[11px] text-slate-500">
          <Link href="/" className="hover:text-red-600">
            হোম
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/donors" className="hover:text-red-600">
            জেলাভিত্তিক রক্তদাতা
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-slate-700">{district}</span>
        </nav>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-0.5 text-[11px] font-semibold text-red-600">
            <MapPin className="h-3 w-3" />
            {district} জেলা
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{district} জেলার রক্তদাতা</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {!stats.available ? (
              <>নিচে রক্তের গ্রুপ ও থানা বেছে নিয়ে {district} জেলার রক্তদাতা খুঁজুন এবং সরাসরি ফোন করুন।</>
            ) : total > 0 ? (
              <>
                {district} জেলায় এখন <strong className="text-slate-900">{toBanglaNumber(total)} জন</strong> রক্তদাতা রক্ত দিতে
                প্রস্তুত। নিচে রক্তের গ্রুপ ও থানা বেছে নিয়ে খুঁজুন এবং সরাসরি ফোন করুন।
              </>
            ) : (
              <>
                {district} জেলায় এই মুহূর্তে রক্ত দিতে প্রস্তুত কোনো রক্তদাতা নেই। পাশের জেলায় খুঁজে দেখুন, অথবা রোগীর তথ্য
                দিয়ে অনুরোধ করুন।
              </>
            )}
          </p>

          {total > 0 && (
            <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {BLOOD_GROUPS.map((group) => (
                <li key={group}>
                  <Link
                    href={`/find-donor?${new URLSearchParams({ bloodGroup: group, district })}`}
                    className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 py-2 hover:border-red-300 hover:bg-red-50"
                  >
                    <span className="text-sm font-bold text-red-600">{group}</span>
                    <span className="font-mono text-[11px] text-slate-500">{toBanglaNumber(groups[group] ?? 0)} জন</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6">
          <Suspense>
            <DonorSearch defaultDistrict={district} headingLevel="h2" />
          </Suspense>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/patient-search"
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-red-300"
          >
            <Siren className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <span>
              <span className="block text-sm font-bold text-slate-900">জরুরি রক্ত প্রয়োজন?</span>
              <span className="mt-0.5 block text-xs text-slate-600">
                রোগীর তথ্য দিন, কাছের রক্তদাতাদের তালিকা সাথে সাথে পাবেন।
              </span>
            </span>
          </Link>
          <Link
            href="/register"
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-red-300"
          >
            <UserPlus className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <span>
              <span className="block text-sm font-bold text-slate-900">{district} থেকে রক্তদাতা হোন</span>
              <span className="mt-0.5 block text-xs text-slate-600">
                বিনামূল্যে রেজিস্ট্রেশন করে আপনার এলাকার মানুষের পাশে দাঁড়ান।
              </span>
            </span>
          </Link>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <HeartPulse className="h-5 w-5 text-red-600" />
            অন্য জেলার রক্তদাতা
          </h2>
          <div className="mt-4">
            <DistrictLinks stats={stats} current={district} />
          </div>
        </section>
      </div>
    </main>
  );
}
