"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleCheck, Info, Loader2, MapPin, Megaphone, PhoneCall, Search, SearchX } from "lucide-react";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import ComplaintButton from "@/components/ComplaintButton";
import ThanaSelect from "@/components/ThanaSelect";
import { ApiError, searchForPatient } from "@/lib/api";
import { BLOOD_GROUPS, type BloodGroup, DISTRICTS, type Donor, formatLocation, NOT_MENTIONED, toBanglaNumber } from "@/lib/data";

const fieldClass =
  "h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-800 focus:bg-white focus:outline-none";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

type Result =
  | {
      kind: "found";
      donors: Donor[];
      total: number;
      nearbyDonors: Donor[];
      nearbyTotal: number;
      bloodGroup: string;
      district: string;
      upazila: string;
    }
  | { kind: "duplicate"; message: string; bloodGroup: string; district: string };

export default function PatientSearch() {
  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [bagsNeeded, setBagsNeeded] = useState(1);
  const [neededDate, setNeededDate] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  // Bring the answer into view once it arrives.
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await searchForPatient({
        patientName: patientName.trim(),
        requiredBloodGroup: bloodGroup as BloodGroup,
        district,
        upazila: upazila.trim() || undefined,
        hospitalAddress: hospitalAddress.trim() || undefined,
        requesterPhone,
        bagsNeeded,
        neededDate: neededDate || undefined,
      });
      setResult({
        kind: "found",
        donors: response.donors,
        total: response.total,
        nearbyDonors: response.nearbyDonors,
        nearbyTotal: response.nearbyTotal,
        bloodGroup,
        district,
        upazila: upazila.trim(),
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === "DUPLICATE_REQUEST") {
        setResult({ kind: "duplicate", message: err.message, bloodGroup, district });
      } else {
        setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-center">
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-indigo-900">
          জরুরী রক্তের প্রয়োজন
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          রোগীর তথ্য দিয়ে রক্তদাতা খুঁজুন
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          কোনো লগইন ছাড়াই রোগীর তথ্য ও ঠিকানা দিন। সাথে সাথে এলাকার ডোনারদের তালিকা পাবেন, আর আপনার অনুরোধটি পোস্ট
          করা হবে যাতে আরও ডোনার আপনার সাথে যোগাযোগ করতে পারেন।
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>রোগীর নাম / কেস আইডি</span>
          <input
            type="text"
            required
            maxLength={100}
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="রোগীর নাম বা কেস আইডি লিখুন"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>প্রয়োজনীয় রক্তের গ্রুপ</span>
          <select required value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={fieldClass}>
            <option value="" disabled>
              রক্তের গ্রুপ নির্বাচন করুন
            </option>
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>জেলা</span>
          <select
            required
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setUpazila("");
            }}
            className={fieldClass}
          >
            <option value="" disabled>
              জেলা নির্বাচন করুন
            </option>
            {DISTRICTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>
            থানা / উপজেলা <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
          </span>
          <ThanaSelect
            district={district}
            value={upazila}
            onChange={setUpazila}
            emptyLabel="পুরো জেলায় খুঁজুন"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>কত ব্যাগ রক্ত লাগবে</span>
          <select value={bagsNeeded} onChange={(e) => setBagsNeeded(Number(e.target.value))} className={fieldClass}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {toBanglaNumber(n)} ব্যাগ
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>
            কবে প্রয়োজন <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
          </span>
          <input type="date" value={neededDate} onChange={(e) => setNeededDate(e.target.value)} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>যোগাযোগের মোবাইল নাম্বার</span>
          <input
            type="tel"
            inputMode="numeric"
            required
            maxLength={11}
            pattern="01[3-9][0-9]{8}"
            title="সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01712345678)"
            value={requesterPhone}
            onChange={(e) => setRequesterPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="01712345678"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>
            হাসপাতালের ঠিকানা <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
          </span>
          <input
            type="text"
            maxLength={200}
            value={hospitalAddress}
            onChange={(e) => setHospitalAddress(e.target.value)}
            placeholder="যেমন: চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল"
            className={fieldClass}
          />
        </label>

        <p className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600 sm:col-span-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-800" />
          অ্যাডমিন যাচাই করার পর আপনার অনুরোধটি (রোগীর নাম, রক্তের গ্রুপ, এলাকা, হাসপাতাল ও যোগাযোগের নাম্বার)
          &quot;রক্তের অনুরোধ&quot; পাতায় পোস্ট করা হবে, যাতে ডোনাররা সরাসরি আপনার সাথে যোগাযোগ করতে পারেন। একটি নাম্বার
          থেকে দিনে একবার অনুরোধ করা যায়।
        </p>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex h-14 items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] font-semibold text-white shadow-lg shadow-indigo-900/20 hover:bg-[#1e3070] disabled:opacity-60 sm:col-span-2"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          এই ঠিকানার রক্তদাতাদের খুঁজুন
        </button>
      </form>

      <div ref={resultRef} className="scroll-mt-4">
        {result?.kind === "duplicate" && <DuplicateNotice result={result} />}
        {result?.kind === "found" && <FoundDonors result={result} />}
      </div>
    </section>
  );
}

const findDonorHref = (bloodGroup: string, district?: string) =>
  `/find-donor?${new URLSearchParams({ bloodGroup, ...(district && { district }) })}`;

function DuplicateNotice({ result }: { result: Extract<Result, { kind: "duplicate" }> }) {
  return (
    <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <p className="flex items-center gap-2 font-bold text-amber-900">
        <Info className="h-5 w-5" />
        আপনি আজ ইতিমধ্যে একবার অনুরোধ করেছেন
      </p>
      <p className="mt-2 text-sm leading-relaxed text-amber-900/90">{result.message}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={findDonorHref(result.bloodGroup, result.district)}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700"
        >
          <Search className="h-4 w-4" />
          ডোনার খুঁজুন পাতায় যান
        </Link>
        <Link
          href="/blood-requests"
          className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
        >
          <Megaphone className="h-4 w-4" />
          রক্তের অনুরোধগুলো দেখুন
        </Link>
      </div>
    </div>
  );
}

function FoundDonors({ result }: { result: Extract<Result, { kind: "found" }> }) {
  const { donors, nearbyDonors, bloodGroup, district, upazila } = result;
  const area = upazila ? `${upazila}, ${district}` : district;
  // Totals across all matches; each list below shows at most the first 100.
  const total = result.total + result.nearbyTotal;
  const localHref = `/find-donor?${new URLSearchParams({ bloodGroup, district, ...(upazila && { upazila }) })}`;

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 font-bold text-emerald-900">
          <CircleCheck className="h-5 w-5" />
          আপনার অনুরোধটি আমরা পেয়েছি
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
          আমরা আপনার রোগীর জন্য ডোনার খোঁজার চেষ্টা করছি। অ্যাডমিন যাচাই করার পর অনুরোধটি &quot;রক্তের অনুরোধ&quot; পাতায়
          পোস্ট করা হবে, যাতে আরও ডোনার আপনার সাথে যোগাযোগ করতে পারেন।{" "}
          {total > 0 && "ততক্ষণ নিচের ডোনারদের সরাসরি কল করে জেনে নিন তাঁরা এখন রক্ত দিতে পারবেন কিনা।"}
        </p>
      </div>

      {total === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">
          <SearchX className="h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm">
            এই মুহূর্তে {district} জেলায় {bloodGroup} গ্রুপের কোনো ডোনার পাওয়া যায়নি। অনুরোধটি পোস্ট হলে ডোনাররা আপনার সাথে
            যোগাযোগ করতে পারবেন।
          </p>
          <Link href={findDonorHref(bloodGroup)} className="mt-4 text-sm font-semibold text-red-600 hover:underline">
            সারাদেশে {bloodGroup} ডোনার খুঁজুন →
          </Link>
        </div>
      ) : (
        <>
          <DonorList
            title={`${area} এলাকার ${bloodGroup} ডোনার (${toBanglaNumber(result.total)} জন)`}
            donors={donors}
            total={result.total}
            moreHref={localHref}
            emptyText={upazila ? `${upazila}-এ এই গ্রুপের কোনো ডোনার পাওয়া যায়নি। নিচে একই জেলার অন্যান্য ডোনার দেখুন।` : ""}
          />
          {nearbyDonors.length > 0 && (
            <DonorList
              title={`${district} জেলার অন্যান্য এলাকার ${bloodGroup} ডোনার (${toBanglaNumber(result.nearbyTotal)} জন)`}
              donors={nearbyDonors}
              total={result.nearbyTotal}
              moreHref={findDonorHref(bloodGroup, district)}
            />
          )}
        </>
      )}
    </div>
  );
}

function DonorList({
  title,
  donors,
  total,
  moreHref,
  emptyText,
}: {
  title: string;
  donors: Donor[];
  total: number;
  moreHref: string;
  emptyText?: string;
}) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {donors.length === 0 ? (
        emptyText && <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {donors.map((donor) => (
            <li
              key={donor.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{donor.bloodGroup}</span>
                  <span className="font-bold text-slate-900">{donor.fullName}</span>
                  <AvailabilityBadge />
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" fill="currentColor" />
                  {formatLocation(donor.district, donor.upazila)}
                  {" | "}শেষ রক্তদান:{" "}
                  <span className="font-semibold text-slate-700">{donor.lastDonationDate ?? NOT_MENTIONED}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ComplaintButton donor={donor} />
                <a
                  href={`tel:${donor.phoneNumber}`}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  {donor.phoneNumber} (কল দিন)
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      {total > donors.length && (
        <Link href={moreHref} className="mt-3 inline-block text-sm font-semibold text-red-600 hover:underline">
          আরও {toBanglaNumber(total - donors.length)} জন আছেন, &quot;ডোনার খুঁজুন&quot; পাতায় সবাইকে দেখুন →
        </Link>
      )}
    </div>
  );
}
