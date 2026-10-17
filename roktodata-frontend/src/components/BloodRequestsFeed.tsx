"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CircleAlert,
  CircleCheck,
  Droplets,
  Hospital,
  Loader2,
  MapPin,
  Megaphone,
  PhoneCall,
  Plus,
  User,
} from "lucide-react";
import { ApiError, getBloodRequests } from "@/lib/api";
import { BLOOD_GROUPS, DISTRICTS, toBanglaNumber, type BloodRequest } from "@/lib/data";

const fieldClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-red-500 focus:outline-none";

export default function BloodRequestsFeed() {
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  // Loading until the response for the current filters and page has arrived.
  const requestKey = `${bloodGroup}|${district}|${page}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    getBloodRequests({ bloodGroup, district, page })
      .then((result) => {
        if (cancelled) return;
        // Page 1 replaces the list (new filters); later pages append ("আরও দেখুন").
        setRequests((current) => (page === 1 ? result.requests : [...current, ...result.requests]));
        setPages(result.pages);
        setError("");
        setLoadedKey(requestKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [bloodGroup, district, page, requestKey]);

  const changeFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Megaphone className="h-5 w-5 text-red-600" />
              রক্তের অনুরোধসমূহ
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              যাঁদের রক্ত প্রয়োজন, তাঁদের যাচাইকৃত অনুরোধ। আপনি রক্ত দিতে পারলে সরাসরি কল করুন।
            </p>
          </div>
          <Link
            href="/patient-search"
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            নতুন অনুরোধ করুন
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] text-slate-600">রক্তের গ্রুপ</span>
            <select value={bloodGroup} onChange={(e) => changeFilter(setBloodGroup)(e.target.value)} className={fieldClass}>
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
            <select value={district} onChange={(e) => changeFilter(setDistrict)(e.target.value)} className={fieldClass}>
              <option value="">সকল জেলা</option>
              {DISTRICTS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-red-200 bg-red-50 py-12 text-center text-red-700">
          <CircleAlert className="h-8 w-8" />
          <p className="mt-2 text-sm">{error}</p>
        </div>
      ) : loading && page === 1 ? (
        <div className="mt-6 flex justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">
          <Droplets className="h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm">এই মুহূর্তে কোনো রক্তের অনুরোধ নেই।</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {requests.map((request) => (
              <RequestPost key={request.id} request={request} />
            ))}
          </div>
          {page < pages && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                আরও দেখুন
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function RequestPost({ request }: { request: BloodRequest }) {
  const fulfilled = request.status === "Fulfilled";
  const location = request.upazila ? `${request.upazila}, ${request.district}` : request.district;

  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-sm ${fulfilled ? "border-emerald-200 opacity-75" : "border-slate-200"}`}
    >
      <header className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-base font-bold text-white shadow-md shadow-red-600/30">
          {request.requiredBloodGroup}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-900">
            {toBanglaNumber(request.bagsNeeded)} ব্যাগ {request.requiredBloodGroup} রক্ত প্রয়োজন
          </h2>
          <p className="text-xs text-slate-400">পোস্ট: {toBanglaNumber(request.createdAt.slice(0, 10))}</p>
        </div>
        {fulfilled && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <CircleCheck className="h-3 w-3" />
            রক্ত পাওয়া গেছে
          </span>
        )}
      </header>

      <dl className="mt-4 space-y-1.5 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <dt className="sr-only">রোগী</dt>
          <dd>রোগী: {request.patientName}</dd>
        </div>
        {request.hospitalAddress && (
          <div className="flex items-start gap-2">
            <Hospital className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <dt className="sr-only">হাসপাতাল</dt>
            <dd>{request.hospitalAddress}</dd>
          </div>
        )}
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <dt className="sr-only">এলাকা</dt>
          <dd>{location}</dd>
        </div>
        {request.neededDate && (
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <dt className="sr-only">কবে প্রয়োজন</dt>
            <dd>
              প্রয়োজন: <span className="font-semibold text-slate-800">{toBanglaNumber(request.neededDate)}</span>
            </dd>
          </div>
        )}
      </dl>

      {!fulfilled && (
        <footer className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="font-mono text-xs font-semibold text-slate-700">{request.requesterPhone}</span>
          <a
            href={`tel:${request.requesterPhone}`}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            যোগাযোগ করুন
          </a>
        </footer>
      )}
    </article>
  );
}
