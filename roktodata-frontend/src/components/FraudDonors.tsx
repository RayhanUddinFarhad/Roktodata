"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Ban, CircleAlert, Loader2, Search, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import FraudReportButton from "@/components/FraudReportButton";
import { ApiError, checkFraudNumber, getFraudEntries } from "@/lib/api";
import { toBanglaNumber, type FraudEntry } from "@/lib/data";

type CheckResult = { phoneNumber: string; entry: FraudEntry | null };

export default function FraudDonors() {
  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-lg">
            <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              প্রতারক ডোনার তালিকা
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              রক্তদানের নামে টাকা নেওয়া বা প্রতারণা করেছে এমন নাম্বারের অ্যাডমিন-যাচাইকৃত তালিকা। কারো সাথে যোগাযোগের
              আগে নাম্বারটি যাচাই করে নিন।
            </p>
          </div>
          <FraudReportButton />
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          রক্তদান সম্পূর্ণ স্বেচ্ছাসেবী। কোনো ডোনার রক্ত দেওয়ার আগে টাকা চাইলে সতর্ক হোন, আগাম টাকা পাঠাবেন না।
        </p>
        <NumberCheck />
      </section>

      <FraudList />
    </>
  );
}

function NumberCheck() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await checkFraudNumber(phone);
      setResult({ phoneNumber: response.phoneNumber, entry: response.entry });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <label className="flex-1">
          <span className="mb-1 block text-[11px] text-slate-600">মোবাইল নাম্বার দিয়ে যাচাই করুন</span>
          <input
            type="tel"
            inputMode="numeric"
            required
            maxLength={13}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ""));
              setResult(null);
            }}
            placeholder="01712345678"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm text-slate-700 focus:border-red-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="flex h-10 items-center justify-center gap-1.5 self-end rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 max-sm:w-full"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          যাচাই করুন
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {result &&
        (result.entry ? (
          <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-4">
            <p className="flex items-center gap-2 font-bold text-red-700">
              <ShieldAlert className="h-5 w-5" />
              সতর্কতা! {result.phoneNumber} নাম্বারটি প্রতারক হিসেবে চিহ্নিত
            </p>
            {result.entry.names.length > 0 && (
              <p className="mt-1 text-sm font-semibold text-slate-800">{result.entry.names.join(" / ")}</p>
            )}
            {result.entry.blockedDonor && <BlockedDonorBadge />}
            <FraudEntryDetails entry={result.entry} />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 font-bold text-emerald-800">
              <ShieldCheck className="h-5 w-5" />
              {result.phoneNumber} নাম্বারের বিরুদ্ধে কোনো যাচাইকৃত রিপোর্ট নেই
            </p>
            <p className="mt-1 text-xs text-emerald-900/80">
              তবুও সতর্ক থাকুন। রক্ত পাওয়ার আগে কাউকে টাকা পাঠাবেন না। প্রতারণার শিকার হলে উপরের বাটন দিয়ে রিপোর্ট করুন।
            </p>
          </div>
        ))}
    </div>
  );
}

function FraudList() {
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<FraudEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [loadedPage, setLoadedPage] = useState(0);
  const loading = loadedPage !== page;

  useEffect(() => {
    let cancelled = false;
    getFraudEntries(page)
      .then((result) => {
        if (cancelled) return;
        setEntries((current) => (page === 1 ? result.entries : [...current, ...result.entries]));
        setTotal(result.total);
        setPages(result.pages);
        setLoadedPage(page);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        setLoadedPage(page);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <section className="mt-8">
      <h2 className="font-bold text-slate-900">
        চিহ্নিত প্রতারক নাম্বার ({loading && page === 1 ? "..." : toBanglaNumber(total)})
      </h2>

      {error ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-red-200 bg-red-50 py-12 text-center text-red-700">
          <CircleAlert className="h-8 w-8" />
          <p className="mt-2 text-sm">{error}</p>
        </div>
      ) : loading && page === 1 ? (
        <div className="mt-4 flex justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">
          <ShieldCheck className="h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm">এখনো কোনো প্রতারক নাম্বার তালিকাভুক্ত হয়নি।</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {entries.map((entry) => (
              <article key={entry.phoneNumber} className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-bold text-red-600">{entry.phoneNumber}</p>
                    {entry.names.length > 0 && (
                      <p className="text-sm font-semibold text-slate-800">{entry.names.join(" / ")}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                    {toBanglaNumber(entry.reportCount)}টি রিপোর্ট
                  </span>
                </header>
                {entry.blockedDonor && <BlockedDonorBadge />}
                <FraudEntryDetails entry={entry} />
              </article>
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
    </section>
  );
}

function FraudEntryDetails({ entry }: { entry: FraudEntry }) {
  return (
    <ul className="mt-3 space-y-2">
      {entry.reports.map((report, index) => (
        <li key={index} className={`rounded-lg px-3 py-2 text-sm ${report.source === "admin" ? "bg-red-50" : "bg-slate-50"}`}>
          <p className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-red-700">{report.reasonLabel}</span>
            <span className="text-[11px] text-slate-400">{toBanglaNumber(report.createdAt.slice(0, 10))}</span>
          </p>
          {report.details && <p className="mt-1 whitespace-pre-line text-slate-700">{report.details}</p>}
        </li>
      ))}
    </ul>
  );
}

// The number belongs to a donor registered on this site whom the admin has blocked.
function BlockedDonorBadge() {
  return (
    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
      <Ban className="h-3 w-3" />
      নিবন্ধিত ডোনার · অ্যাডমিন ব্লক করেছেন
    </p>
  );
}
