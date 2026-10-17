"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CircleCheck, Flag, Loader2, X } from "lucide-react";
import { ApiError, submitComplaint } from "@/lib/api";
import { COMPLAINT_REASONS, type ComplaintReason, type Donor } from "@/lib/data";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none";

export default function ComplaintButton({ donor }: { donor: Pick<Donor, "id" | "fullName"> }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="এই ডোনারের বিরুদ্ধে অভিযোগ করুন"
        className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
      >
        <Flag className="h-3 w-3" />
        অভিযোগ
      </button>
      {open && <ComplaintDialog donor={donor} onClose={() => setOpen(false)} />}
    </>
  );
}

function ComplaintDialog({ donor, onClose }: { donor: Pick<Donor, "id" | "fullName">; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState<ComplaintReason | "">("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reason) return;
    setError("");
    setLoading(true);
    try {
      const result = await submitComplaint({
        donorId: donor.id,
        complainantPhone: phone,
        reason,
        details: details.trim() || undefined,
      });
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 text-left"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="complaint-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Flag className="h-5 w-5 text-red-600" />
              ডোনারের বিরুদ্ধে অভিযোগ
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">ডোনার: {donor.fullName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="mt-5 flex flex-col items-center rounded-xl bg-emerald-50 px-4 py-6 text-center">
            <CircleCheck className="h-9 w-9 text-emerald-600" />
            <p className="mt-2 text-sm text-slate-700">{success}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              ঠিক আছে
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">আপনার মোবাইল নাম্বার</span>
              <input
                type="tel"
                inputMode="numeric"
                required
                autoFocus
                maxLength={11}
                pattern="01[3-9][0-9]{8}"
                title="সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01712345678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="01712345678"
                className={`${fieldClass} h-10`}
              />
              <span className="mt-1 block text-[10px] text-slate-500">
                অ্যাডমিন প্রয়োজনে এই নাম্বারে যোগাযোগ করবেন। এটি প্রকাশ করা হবে না।
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">অভিযোগের কারণ</span>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value as ComplaintReason)}
                className={`${fieldClass} h-10`}
              >
                <option value="" disabled>
                  কারণ নির্বাচন করুন
                </option>
                {Object.entries(COMPLAINT_REASONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                বিস্তারিত <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
              </span>
              <textarea
                rows={3}
                maxLength={500}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="কী ঘটেছে সংক্ষেপে লিখুন"
                className={`${fieldClass} py-2`}
              />
            </label>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-10 flex-1 rounded-lg bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                অভিযোগ জমা দিন
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
