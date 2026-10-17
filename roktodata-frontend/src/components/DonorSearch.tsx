"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, Funnel, Loader2, RotateCw, SearchX } from "lucide-react";
import DonorCard from "@/components/DonorCard";
import { ApiError, searchDonors } from "@/lib/api";
import { BLOOD_GROUPS, DISTRICTS, type Donor } from "@/lib/data";

const fieldClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-red-500 focus:outline-none";

export default function DonorSearch() {
  const searchParams = useSearchParams();
  const [bloodGroup, setBloodGroup] = useState(searchParams.get("bloodGroup") ?? "");
  const [district, setDistrict] = useState(searchParams.get("district") ?? "");
  const [thana, setThana] = useState(searchParams.get("upazila") ?? "");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    // Wait for the user to stop typing in the thana field before searching.
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await searchDonors({ bloodGroup, district, upazila: thana }, controller.signal);
        setDonors(result.donors);
      } catch (err) {
        if (controller.signal.aborted) return;
        setDonors([]);
        setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
      setLoading(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [bloodGroup, district, thana]);

  function resetFilters() {
    setBloodGroup("");
    setDistrict("");
    setThana("");
  }

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Funnel className="h-5 w-5 text-red-600" fill="currentColor" />
          রক্তদাতা ফিল্টার ও অনুসন্ধান
        </h1>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <label className="block">
            <span className="mb-1 block text-[11px] text-slate-600">রক্তের গ্রুপ</span>
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={fieldClass}>
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
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className={fieldClass}>
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
            <input
              type="text"
              value={thana}
              onChange={(e) => setThana(e.target.value)}
              placeholder="থানার নাম লিখুন..."
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

      <h2 className="mt-8 flex items-center gap-2 font-bold text-slate-900">
        উপলব্ধ রক্তদাতাগণ ({loading ? "..." : donors.length})
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </h2>

      {error ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-red-200 bg-red-50 py-12 text-center text-red-700">
          <CircleAlert className="h-8 w-8" />
          <p className="mt-2 text-sm">{error}</p>
        </div>
      ) : loading && donors.length === 0 ? null : donors.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {donors.map((donor) => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">
          <SearchX className="h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm">এই ফিল্টারে কোনো রক্তদাতা পাওয়া যায়নি।</p>
        </div>
      )}
    </>
  );
}
