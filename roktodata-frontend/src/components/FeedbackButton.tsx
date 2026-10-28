"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CircleCheck, Loader2, MessageSquareHeart, PenLine } from "lucide-react";
import Modal from "@/components/Modal";
import ThanaSelect from "@/components/ThanaSelect";
import { ApiError, submitFeedback } from "@/lib/api";
import { DISTRICTS, FEEDBACK_ROLES, toBanglaNumber, type FeedbackRole } from "@/lib/data";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";
const MAX = 500;

// "আপনার অভিজ্ঞতা লিখুন" and its form. Opens by itself when the page is reached with #write (e.g. from
// a request that got its blood).
export default function FeedbackButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // The address is only known in the browser; opening from it once after load is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.hash === "#write") setOpen(true);
  }, []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-700 ${className}`}
      >
        <PenLine className="h-4 w-4" />
        আপনার অভিজ্ঞতা লিখুন
      </button>
      {open && <FeedbackDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [role, setRole] = useState<FeedbackRole | "">("");
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!role) return setError("আপনি কে হিসেবে লিখছেন, বেছে নিন।");
    setError("");
    setLoading(true);
    try {
      const result = await submitFeedback({
        name: name.trim(),
        district,
        upazila: upazila || undefined,
        role,
        message: message.trim(),
        phoneNumber: phoneNumber || undefined,
        website: website || undefined,
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
      title="আপনার অভিজ্ঞতা লিখুন"
      subtitle="অ্যাডমিন দেখে অনুমোদন দিলে সাইটে দেখা যাবে"
      icon={<MessageSquareHeart className="h-5 w-5 text-red-600" />}
      onClose={onClose}
    >
      {success ? (
        <div className="mt-5 flex flex-col items-center rounded-xl bg-emerald-50 px-4 py-6 text-center">
          <CircleCheck className="h-9 w-9 text-emerald-600" />
          <p className="mt-2 text-sm text-slate-700">{success}</p>
          <button type="button" onClick={onClose} className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            ঠিক আছে
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <fieldset>
            <legend className={labelClass}>আপনি লিখছেন</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(FEEDBACK_ROLES) as [FeedbackRole, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  aria-pressed={role === value}
                  className={`h-10 rounded-lg border text-sm font-semibold ${
                    role === value ? "border-red-500 bg-red-50 text-red-700" : "border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className={labelClass}>আপনার নাম</span>
            <input type="text" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: রহিম উদ্দিন" className={`${fieldClass} h-10`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>জেলা</span>
              <select
                required
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setUpazila("");
                }}
                className={`${fieldClass} h-10`}
              >
                <option value="" disabled>
                  জেলা বেছে নিন
                </option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>থানা / উপজেলা (ঐচ্ছিক)</span>
              <ThanaSelect district={district} value={upazila} onChange={setUpazila} emptyLabel="বেছে নিন" className={`${fieldClass} h-10`} />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>আপনার অভিজ্ঞতা</span>
            <textarea
              rows={5}
              required
              minLength={10}
              maxLength={MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="যেমন: রাত ২টায় বাবার জন্য O- রক্ত লাগছিল। রক্তদাতা থেকে কল দিয়ে এক ঘণ্টার মধ্যে ডোনার পেয়েছি।"
              className={`${fieldClass} py-2`}
            />
            <span className="mt-1 block text-right text-[10px] text-slate-400">
              {toBanglaNumber(message.length)}/{toBanglaNumber(MAX)}
            </span>
          </label>
          <label className="block">
            <span className={labelClass}>মোবাইল নাম্বার (ঐচ্ছিক)</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={13}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="01712345678"
              className={`${fieldClass} h-10`}
            />
            <span className="mt-1 block text-[10px] text-slate-500">প্রয়োজনে অ্যাডমিন যোগাযোগ করবেন। নাম্বার সাইটে দেখানো হবে না।</span>
          </label>
          {/* Not for people: left empty by them, filled by spam bots. */}
          <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-10 flex-1 rounded-lg bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              জমা দিন
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
