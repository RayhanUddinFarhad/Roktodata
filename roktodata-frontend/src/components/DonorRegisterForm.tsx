"use client";

import { useRef, useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { CircleCheck, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import ThanaSelect from "@/components/ThanaSelect";
import { ApiError, registerOrUpdateDonor } from "@/lib/api";
import { BLOOD_GROUPS, DISTRICTS, type BloodGroup } from "@/lib/data";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";

const PHONE_PATTERN = /^01[3-9]\d{8}$/;

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-phone-number": "মোবাইল নাম্বারটি সঠিক নয়।",
  "auth/too-many-requests": "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  "auth/invalid-verification-code": "ভেরিফিকেশন কোডটি সঠিক নয়।",
  "auth/code-expired": "কোডের মেয়াদ শেষ হয়ে গেছে। আবার কোড পাঠান।",
  "auth/operation-not-allowed": "ফোন দিয়ে লগইন এখনো চালু করা হয়নি।",
  "auth/configuration-not-found": "ফোন দিয়ে লগইন এখনো চালু করা হয়নি।",
};

// Must match REQUIRE_PHONE_VERIFICATION in the backend. When off, donors save with just their number.
const PHONE_VERIFICATION = process.env.NEXT_PUBLIC_PHONE_VERIFICATION === "true";

function errorMessage(err: unknown) {
  if (err instanceof FirebaseError && FIREBASE_ERRORS[err.code]) return FIREBASE_ERRORS[err.code];
  if (err instanceof ApiError) return err.message;
  return "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
}

type Step = "form" | "otp" | "done";

export default function DonorRegisterForm() {
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [lastDonated, setLastDonated] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [isReadyToDonate, setIsReadyToDonate] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  async function saveDonor(idToken?: string) {
    const result = await registerOrUpdateDonor(
      {
        fullName: name.trim(),
        phoneNumber: phone,
        bloodGroup: bloodGroup as BloodGroup,
        district,
        upazila: thana,
        lastDonationDate: lastDonated || undefined,
        isReadyToDonate,
      },
      idToken,
    );
    setSuccessMessage(result.message);
    setStep("done");
  }

  async function submitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!PHONE_PATTERN.test(phone)) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 01712345678)।");
      return;
    }
    if (lastDonated && lastDonated > new Date().toISOString().slice(0, 10)) {
      setError("শেষ রক্তদানের তারিখ ভবিষ্যতের হতে পারবে না।");
      return;
    }

    setLoading(true);
    try {
      if (!PHONE_VERIFICATION) {
        await saveDonor();
        return;
      }
      auth.languageCode = "bn";
      verifierRef.current ??= new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      confirmationRef.current = await signInWithPhoneNumber(auth, `+88${phone}`, verifierRef.current);
      setStep("otp");
    } catch (err) {
      verifierRef.current?.clear();
      verifierRef.current = null;
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirmationRef.current) return;
    setError("");
    setLoading(true);
    try {
      // A code can only be used once, so if saving failed after a successful
      // verification, retry with the already signed-in user.
      const user =
        auth.currentUser?.phoneNumber === `+88${phone}`
          ? auth.currentUser
          : (await confirmationRef.current.confirm(code.trim())).user;
      await saveDonor(await user.getIdToken());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-center">
        <span className="inline-block rounded-full bg-red-100 px-3 py-0.5 text-[11px] font-semibold text-red-600">
          ডোনার পোর্টাল
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">ডোনার রেজিস্ট্রেশন বা আপডেট</h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          আপনার মোবাইল নাম্বার দিন। নাম্বার আগে থেকে রেজিস্টার্ড থাকলে তথ্য আপডেট হবে, না হলে নতুন ডোনার হিসেবে যুক্ত হবেন।
        </p>
      </div>

      {step === "form" && (
        <form onSubmit={submitForm} className="mt-6 grid grid-cols-2 gap-x-3 gap-y-4">
          <label className="col-span-2 block">
            <span className={labelClass}>মোবাইল নাম্বার (ইউনিক আইডি হিসেবে কাজ করবে)</span>
            <span className="flex h-10 items-center rounded-lg border border-slate-300 bg-slate-50 focus-within:border-red-500 focus-within:bg-white">
              <span className="pl-3 pr-2 text-sm text-slate-500">+88</span>
              <input
                type="tel"
                inputMode="numeric"
                required
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="01712345678"
                className="h-full w-full bg-transparent pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </span>
            <span className="mt-1 block text-[10px] text-slate-500">
              সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন। একই নাম্বারে একাধিক প্রোফাইল থাকবে না।
            </span>
          </label>

          <label className="col-span-2 block">
            <span className={labelClass}>পূর্ণ নাম</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="আপনার নাম লিখুন"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>রক্তের গ্রুপ</span>
            <select required value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={fieldClass}>
              <option value="" disabled>
                গ্রুপ নির্বাচন করুন
              </option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>শেষ রক্তদানের তারিখ</span>
            <input
              type="date"
              value={lastDonated}
              onChange={(e) => setLastDonated(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>জেলা</span>
            <select
              required
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setThana("");
              }}
              className={fieldClass}
            >
              <option value="" disabled>
                জেলা নির্বাচন করুন
              </option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>থানা / উপজেলা</span>
            <ThanaSelect district={district} value={thana} onChange={setThana} required className={fieldClass} />
          </label>

          <fieldset className="col-span-2">
            <legend className={labelClass}>রক্তদানের অবস্থা</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: true, label: "রক্ত দিতে প্রস্তুত", active: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                { value: false, label: "এখন প্রস্তুত নই", active: "border-amber-500 bg-amber-50 text-amber-700" },
              ].map((option) => (
                <label
                  key={option.label}
                  className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors ${
                    isReadyToDonate === option.value
                      ? option.active
                      : "border-slate-300 bg-slate-50 text-slate-500 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="isReadyToDonate"
                    checked={isReadyToDonate === option.value}
                    onChange={() => setIsReadyToDonate(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <span className="mt-1 block text-[10px] text-slate-500">
              &quot;এখন প্রস্তুত নই&quot; দিলে অথবা শেষ রক্তদানের পর ৩ মাস না হলে আপনার প্রোফাইল সার্চে দেখাবে না।
            </span>
          </fieldset>

          {error && <p className="col-span-2 text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            তথ্য সংরক্ষণ বা আপডেট করুন
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyAndSave} className="mt-6 space-y-4">
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-indigo-900">
            +88{phone} নাম্বারে একটি ৬ ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।
          </p>
          <label className="block">
            <span className={labelClass}>ভেরিফিকেশন কোড</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="______"
              className={`${fieldClass} text-center tracking-[0.5em]`}
            />
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            যাচাই করে সংরক্ষণ করুন
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setCode("");
              setError("");
            }}
            className="w-full text-xs text-slate-500 hover:text-slate-800"
          >
            ← নাম্বার পরিবর্তন করুন
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="mt-6 flex flex-col items-center rounded-xl bg-emerald-50 px-4 py-8 text-center">
          <CircleCheck className="h-10 w-10 text-emerald-600" />
          <p className="mt-3 font-bold text-slate-900">ধন্যবাদ, {name}!</p>
          <p className="mt-1 text-sm text-slate-600">{successMessage}</p>
        </div>
      )}

      <div id="recaptcha-container" />
    </section>
  );
}
