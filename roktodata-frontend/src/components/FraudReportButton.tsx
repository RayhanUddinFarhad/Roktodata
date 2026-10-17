"use client";

import { useState, type FormEvent } from "react";
import { CircleCheck, Loader2, ShieldAlert, UserX } from "lucide-react";
import Modal from "@/components/Modal";
import { ApiError, submitFraudReport } from "@/lib/api";
import { FRAUD_REASONS, type FraudReason } from "@/lib/data";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";
const digitsOnly = (value: string) => value.replace(/\D/g, "");

export default function FraudReportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700"
      >
        <UserX className="h-4 w-4" />
        প্রতারক ডোনার যোগ করুন
      </button>
      {open && <FraudReportDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function FraudReportDialog({ onClose }: { onClose: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState<FraudReason | "">("");
  const [details, setDetails] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reason) return;
    setError("");
    setLoading(true);
    try {
      const result = await submitFraudReport({
        phoneNumber,
        name: name.trim(),
        reason,
        details: details.trim(),
        reporterPhone,
      });
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="প্রতারক ডোনারের তথ্য দিন"
      subtitle="অ্যাডমিন যাচাই করার পর তালিকায় যোগ করা হবে"
      icon={<ShieldAlert className="h-5 w-5 text-red-600" />}
      onClose={onClose}
    >
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
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block sm:col-span-1">
              <span className={labelClass}>প্রতারকের মোবাইল নাম্বার</span>
              <input
                type="tel"
                inputMode="numeric"
                required
                autoFocus
                maxLength={13}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(digitsOnly(e.target.value))}
                placeholder="01712345678"
                className={`${fieldClass} h-10`}
              />
            </label>
            <label className="col-span-2 block sm:col-span-1">
              <span className={labelClass}>প্রতারকের নাম</span>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যে নাম ব্যবহার করেছে"
                className={`${fieldClass} h-10`}
              />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>প্রতারণার ধরন</span>
            <select
              required
              value={reason}
              onChange={(e) => setReason(e.target.value as FraudReason)}
              className={`${fieldClass} h-10`}
            >
              <option value="" disabled>
                ধরন নির্বাচন করুন
              </option>
              {Object.entries(FRAUD_REASONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>কীভাবে প্রতারণা করেছে</span>
            <textarea
              rows={4}
              required
              minLength={10}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="যেমন: বিকাশে ৫০০ টাকা নিয়ে হাসপাতালে আসেনি, এরপর ফোন বন্ধ করে দিয়েছে।"
              className={`${fieldClass} py-2`}
            />
          </label>
          <label className="block">
            <span className={labelClass}>আপনার মোবাইল নাম্বার</span>
            <input
              type="tel"
              inputMode="numeric"
              required
              maxLength={13}
              value={reporterPhone}
              onChange={(e) => setReporterPhone(digitsOnly(e.target.value))}
              placeholder="01712345678"
              className={`${fieldClass} h-10`}
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              যাচাইয়ের জন্য অ্যাডমিন প্রয়োজনে যোগাযোগ করবেন। আপনার নাম্বার প্রকাশ করা হবে না।
            </span>
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
              রিপোর্ট জমা দিন
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
