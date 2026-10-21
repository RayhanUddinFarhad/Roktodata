"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, Funnel, Loader2, RotateCw, SearchX } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import DonorCard from "@/components/DonorCard";
import { DonorCardSkeletons } from "@/components/DonorSearchSkeleton";
import Pagination from "@/components/Pagination";
import ThanaSelect from "@/components/ThanaSelect";
import { thanasOf } from "@/lib/locations";
import { ApiError, searchDonors, type DonorSearchPage } from "@/lib/api";
import { BLOOD_GROUPS, DISTRICTS, toBanglaNumber } from "@/lib/data";

const fieldClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-red-500 focus:outline-none";

// `defaultDistrict` / `defaultBloodGroup` preselect filters (district and blood group pages);
// `headingLevel` lets a page that has its own <h1> render the filter title as <h2>.
export default function DonorSearch({
  defaultDistrict = "",
  defaultBloodGroup = "",
  headingLevel = "h1",
}: {
  defaultDistrict?: string;
  defaultBloodGroup?: string;
  headingLevel?: "h1" | "h2";
}) {
  const searchParams = useSearchParams();
  const initialDistrict = searchParams.get("district") ?? defaultDistrict;
  const [bloodGroup, setBloodGroup] = useState(searchParams.get("bloodGroup") ?? defaultBloodGroup);
  const [district, setDistrict] = useState(initialDistrict);
  // Only accept a thana from the URL if it belongs to the chosen district.
  const [thana, setThana] = useState(() => {
    const fromUrl = searchParams.get("upazila") ?? "";
    return thanasOf(initialDistrict).includes(fromUrl) ? fromUrl : "";
  });
  const Heading = headingLevel;
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<DonorSearchPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const resultsRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let slowTimer: ReturnType<typeof setTimeout> | undefined;
    // Briefly wait so quick successive filter changes trigger a single search.
    const timer = setTimeout(async () => {
      setLoading(true);
      setSlow(false);
      setError("");
      // A sleeping free-tier server can take a while to answer the first request.
      slowTimer = setTimeout(() => setSlow(true), 5000);
      try {
        setResult(await searchDonors({ bloodGroup, district, upazila: thana }, page, controller.signal));
      } catch (err) {
        if (controller.signal.aborted) return;
        setResult(null);
        setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      } finally {
        clearTimeout(slowTimer);
      }
      setLoading(false);
      setSlow(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(slowTimer);
      controller.abort();
    };
  }, [bloodGroup, district, thana, page, retryKey]);

  // Changing a filter starts again from the first page.
  const changeFilter = (update: () => void) => {
    update();
    setPage(1);
  };

  function resetFilters() {
    changeFilter(() => {
      setBloodGroup("");
      setDistrict("");
      setThana("");
    });
  }

  function goToPage(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const donors = result?.donors ?? [];
  const total = result?.total ?? 0;
  const firstShown = result ? (result.page - 1) * result.pageSize + 1 : 0;

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <Heading className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Funnel className="h-5 w-5 text-red-600" fill="currentColor" />
          রক্তদাতা ফিল্টার ও অনুসন্ধান
        </Heading>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <label className="block">
            <span className="mb-1 block text-[11px] text-slate-600">রক্তের গ্রুপ</span>
            <select
              value={bloodGroup}
              onChange={(e) => changeFilter(() => setBloodGroup(e.target.value))}
              className={fieldClass}
            >
              <option value="">সকল গ্রুপ</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-slate-600">জেলা</span>
            <select
              value={district}
              onChange={(e) =>
                changeFilter(() => {
                  setDistrict(e.target.value);
                  setThana("");
                })
              }
              className={fieldClass}
            >
              <option value="">সকল জেলা</option>
              {DISTRICTS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-slate-600">থানা</span>
            <ThanaSelect
              district={district}
              value={thana}
              onChange={(value) => changeFilter(() => setThana(value))}
              emptyLabel="সকল থানা"
              className={fieldClass}
            />
          </label>
          <button
            type="button"
            onClick={resetFilters}
            className="flex h-10 items-center justify-center gap-1.5 rounded-md bg-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-300"
          >
            <RotateCw className="h-4 w-4" />
            রিসেট ফিল্টার
          </button>
        </div>
      </section>

      <div ref={resultsRef} className="mt-8 flex scroll-mt-20 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          উপলব্ধ রক্তদাতাগণ ({result ? toBanglaNumber(total) : "..."})
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </h2>
        {result && total > 0 && result.pages > 1 && (
          <p className="text-xs text-slate-500">
            {toBanglaNumber(firstShown)}–{toBanglaNumber(firstShown + donors.length - 1)} জন দেখানো হচ্ছে · পৃষ্ঠা{" "}
            {toBanglaNumber(result.page)}/{toBanglaNumber(result.pages)}
          </p>
        )}
      </div>
      {!(result && total === 0) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
          ফোন না ধরলে WhatsApp-এ মেসেজ রেখে দিন, রক্তদাতা সুবিধামতো উত্তর দিতে পারবেন।
        </p>
      )}

      {slow && loading && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          সার্ভার চালু হচ্ছে, একটু অপেক্ষা করুন। অনেকক্ষণ কেউ না ঢুকলে প্রথমবার ৩০–৬০ সেকেন্ড লাগতে পারে।
        </p>
      )}

      {error ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-red-200 bg-red-50 py-12 text-center text-red-700">
          <CircleAlert className="h-8 w-8" />
          <p className="mt-2 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <RotateCw className="h-4 w-4" />
            আবার চেষ্টা করুন
          </button>
        </div>
      ) : !result ? (
        <DonorCardSkeletons />
      ) : donors.length > 0 ? (
        <>
          <div className={`mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
            {donors.map((donor) => (
              <DonorCard key={donor.id} donor={donor} />
            ))}
          </div>
          <Pagination page={result.page} pages={result.pages} onPage={goToPage} disabled={loading} />
        </>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">
          <SearchX className="h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm">এই ফিল্টারে কোনো রক্তদাতা পাওয়া যায়নি।</p>
        </div>
      )}
    </>
  );
}
