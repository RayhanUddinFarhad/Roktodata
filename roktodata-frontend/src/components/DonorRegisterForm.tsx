"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { CircleCheck, EyeOff, Loader2, MapPin, MessageSquareText, Pencil, Phone, RotateCw, ShieldCheck, UserCheck } from "lucide-react";
import AppInstallButton from "@/components/AppInstallButton";
import OtpInput from "@/components/OtpInput";
import ThanaSelect from "@/components/ThanaSelect";
import PushOfferCard from "@/components/PushOfferCard";
import { ApiError, linkPushDevice, previewName, registerOrUpdateDonor, sendOtp, verifyOtp, type ReadyAgain } from "@/lib/api";
import { BLOOD_GROUPS, DISTRICTS, formatLocation, toBanglaNumber, type BloodGroup } from "@/lib/data";
import { thanasOf } from "@/lib/locations";

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";

const PHONE_PATTERN = /^01[3-9]\d{8}$/;

const READY_AGAIN_OPTIONS: { value: ReadyAgain | null; label: string }[] = [
  { value: 1, label: "১ মাস পর" },
  { value: 3, label: "৩ মাস পর" },
  { value: 6, label: "৬ মাস পর" },
  { value: null, label: "জানি না" },
];
const ELIGIBILITY_DAYS = 90;
const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const bnDate = (date: Date) => `${toBanglaNumber(date.getDate())} ${MONTHS[date.getMonth()]} ${toBanglaNumber(date.getFullYear())}`;

// The date a choice brings a "not ready" donor back (the same date the server works out), or null.
function readyAgainDate(choice: ReadyAgain | null, lastDonated: string) {
  if (!choice) return null;
  if (choice === "eligible") {
    return lastDonated ? new Date(new Date(`${lastDonated}T00:00:00Z`).getTime() + ELIGIBILITY_DAYS * 864e5) : null;
  }
  const date = new Date();
  date.setMonth(date.getMonth() + choice);
  return date;
}
// The day 90 days after the last donation, if that is still to come (then it is offered as a choice).
function eligibleLater(lastDonated: string) {
  const date = readyAgainDate("eligible", lastDonated);
  return date && date.getTime() > Date.now() ? date : null;
}

const STEPS = ["তথ্য দিন", "নাম্বার যাচাই", "সম্পন্ন"] as const;

function errorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  return "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
}

// 01712345678 -> "01712-345678"
const prettyPhone = (phone: string) => `${phone.slice(0, 5)}-${phone.slice(5)}`;

// Seconds -> "৪:০৫"
const clock = (seconds: number) =>
  toBanglaNumber(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);

type Step = "form" | "otp" | "done";

// The page's query string (empty while prerendering), read without useSearchParams so the form
// still renders on the server.
const noSubscribe = () => () => {};
const useQueryString = () => useSyncExternalStore(noSubscribe, () => window.location.search, () => "");

// Details passed by a donor card's "এটা আপনার নাম্বার?" link (only values the form accepts).
function prefillFrom(query: string) {
  const q = new URLSearchParams(query);
  const phone = q.get("phone") ?? "";
  const group = q.get("group") ?? "";
  const district = q.get("district") ?? "";
  const thana = q.get("thana") ?? "";
  const okDistrict = (DISTRICTS as readonly string[]).includes(district);
  return {
    phone: PHONE_PATTERN.test(phone) ? phone : "",
    name: (q.get("name") ?? "").slice(0, 100),
    group: (BLOOD_GROUPS as readonly string[]).includes(group) ? group : "",
    district: okDistrict ? district : "",
    thana: okDistrict && thanasOf(district).includes(thana) ? thana : "",
    hide: q.get("hide") === "1",
  };
}

export default function DonorRegisterForm() {
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [lastDonated, setLastDonated] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [isReadyToDonate, setIsReadyToDonate] = useState(true);
  // With "not ready": when the profile returns to search by itself (null = until changed). Until the
  // donor picks, it is "90 days after the last donation" when that is still to come, else 3 months.
  const [readyAgainChoice, setReadyAgainChoice] = useState<ReadyAgain | null | "auto">("auto");

  // Fill in what a donor card's link passed, once (adjusting state while rendering, as React suggests
  // for state that follows an outside value).
  const query = useQueryString();
  const [prefilledFrom, setPrefilledFrom] = useState("");
  const [hiding, setHiding] = useState(false);
  if (query && query !== prefilledFrom) {
    setPrefilledFrom(query);
    const p = prefillFrom(query);
    if (p.phone) setPhone(p.phone);
    if (p.name) setName(p.name);
    if (p.group) setBloodGroup(p.group);
    if (p.district) setDistrict(p.district);
    if (p.thana) setThana(p.thana);
    if (p.hide) {
      setIsReadyToDonate(false);
      setHiding(true);
    }
  }
  const eligibleOn = eligibleLater(lastDonated);
  const readyAgain: ReadyAgain | null =
    readyAgainChoice === "auto" || (readyAgainChoice === "eligible" && !eligibleOn)
      ? eligibleOn ? "eligible" : 3
      : readyAgainChoice;
  // Worked out only once "not ready" is picked (the page is prerendered without a current date).
  const readyAgainOn = isReadyToDonate ? null : readyAgainDate(readyAgain, lastDonated);
  const readyAgainOptions = eligibleOn
    ? [{ value: "eligible" as const, label: `শেষ রক্তদানের ৯০ দিন পূর্ণ হলে (${bnDate(eligibleOn)})` }, ...READY_AGAIN_OPTIONS]
    : READY_AGAIN_OPTIONS;
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // The name as the site will save and show it (English is converted to Bangla); empty until known.
  const [shownName, setShownName] = useState("");
  // When the current code expires and when a new one may be requested (ms timestamps).
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  // Set when a code is sent and then every second on the code screen (not during prerender).
  const [now, setNow] = useState(0);

  // Number the last code went to, and the token from a successful verification, so a failed
  // save (or going back to fix a detail) doesn't need a new SMS.
  const sentToRef = useRef("");
  const [verification, setVerification] = useState<{ phone: string; token: string } | null>(null);

  useEffect(() => {
    if (step !== "otp") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  const secondsLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const verified = verification?.phone === phone;

  async function saveDonor(verificationToken: string) {
    // With notifications on, this device gets the donor's "you can donate again" reminder.
    const pushEndpoint =
      "Notification" in window && Notification.permission === "granted"
        ? await import("@/lib/push").then((m) => m.pushEndpoint()).catch(() => undefined)
        : undefined;
    const result = await registerOrUpdateDonor(
      {
        fullName: name.trim(),
        phoneNumber: phone,
        bloodGroup: bloodGroup as BloodGroup,
        district,
        upazila: thana,
        lastDonationDate: lastDonated || undefined,
        isReadyToDonate,
        readyAgain: isReadyToDonate ? null : readyAgain,
        pushEndpoint,
      },
      verificationToken,
    );
    setSuccessMessage(result.message);
    setShownName(result.fullName);
    setStep("done");
  }

  async function requestCode() {
    const result = await sendOtp(phone);
    const sentAt = Date.now();
    sentToRef.current = phone;
    setExpiresAt(sentAt + result.expiresInSeconds * 1000);
    setResendAt(sentAt + result.resendInSeconds * 1000);
    setNow(sentAt);
    setCode("");
    setNotice(result.message);
  }

  async function submitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setShownName("");
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
      // Coming back to edit details: an already verified number, or a code sent moments ago, is reused.
      if (!verified && !(sentToRef.current === phone && Date.now() < expiresAt)) await requestCode();
      setStep("otp");
      // Only a preview: if it fails the typed name is shown, and the server converts it on save anyway.
      previewName(name.trim())
        .then((result) => setShownName(result.fullName))
        .catch(() => {});
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setError("");
    setResending(true);
    try {
      await requestCode();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResending(false);
    }
  }

  async function verifyAndSave(entered: string) {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      let token = verified ? verification.token : "";
      if (!token) {
        ({ verificationToken: token } = await verifyOtp(phone, entered));
        setVerification({ phone, token });
      }
      await saveDonor(token);
    } catch (err) {
      // An expired verification needs a fresh code.
      if (err instanceof ApiError && err.code === "PHONE_NOT_VERIFIED") setVerification(null);
      if (err instanceof ApiError && err.code !== "OTP_INVALID") setCode("");
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Past the last step once saved, so every step shows as complete.
  const stepIndex = step === "form" ? 0 : step === "otp" ? 1 : STEPS.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-center">
        <span className="inline-block rounded-full bg-red-100 px-3 py-0.5 text-[11px] font-semibold text-red-700">
          ডোনার পোর্টাল
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">ডোনার রেজিস্ট্রেশন বা আপডেট</h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          আপনার মোবাইল নাম্বার দিন। নাম্বার আগে থেকে রেজিস্টার্ড থাকলে তথ্য আপডেট হবে, না হলে নতুন ডোনার হিসেবে যুক্ত হবেন।
        </p>
      </div>
      {hiding && step === "form" && (
        <p className="mt-4 flex gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs leading-relaxed text-slate-700">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
          <span>
            <strong className="font-semibold text-slate-900">তালিকা থেকে সাময়িকভাবে সরাতে:</strong> আপনার তথ্য স্বয়ংক্রিয়ভাবে যুক্ত
            হয়েছে এবং &quot;এখন প্রস্তুত নই&quot; নির্বাচিত। কবে থেকে আবার প্রস্তুত থাকবেন তা বেছে নিয়ে নাম্বার যাচাই করুন।
          </span>
        </p>
      )}

      <ol className="mt-5 flex items-center" aria-label="ধাপ">
        {STEPS.map((label, index) => (
          <li key={label} className={`flex items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}>
            <span className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  index < stepIndex
                    ? "bg-emerald-500 text-white"
                    : index === stepIndex
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "bg-slate-100 text-slate-400"
                }`}
                aria-current={index === stepIndex ? "step" : undefined}
              >
                {index < stepIndex ? <CircleCheck className="h-4 w-4" /> : toBanglaNumber(index + 1)}
              </span>
              <span
                className={`whitespace-nowrap text-[10px] font-semibold ${index === stepIndex ? "text-red-600" : "text-slate-500"}`}
              >
                {label}
              </span>
            </span>
            {index < STEPS.length - 1 && (
              <span
                className={`mx-2 mb-4 h-0.5 flex-1 rounded-full ${index < stepIndex ? "bg-emerald-400" : "bg-slate-200"}`}
              />
            )}
          </li>
        ))}
      </ol>

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
              সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন। এই নাম্বারে SMS-এ একটি যাচাই কোড যাবে। একই নাম্বারে একাধিক প্রোফাইল থাকবে না।
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
            <span className="mt-1 block text-[10px] text-slate-500">
              বাংলায় লেখা ভালো। ইংরেজিতে লিখলে ওয়েবসাইটে বাংলায় রূপান্তর করে দেখানো হবে।
            </span>
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
                  {isReadyToDonate === option.value && <CircleCheck className="h-4 w-4 shrink-0" />}
                  {option.label}
                </label>
              ))}
            </div>
            {!isReadyToDonate && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-900">কবে থেকে আবার প্রস্তুত?</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {readyAgainOptions.map((option) => (
                    <label
                      key={option.label}
                      className={`flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-center text-xs font-semibold transition-colors ${
                        option.value === "eligible" ? "col-span-2 sm:col-span-4" : ""
                      } ${
                        readyAgain === option.value
                          ? "border-amber-600 bg-amber-500 text-white shadow-sm"
                          : "border-amber-200 bg-white text-slate-600 hover:border-amber-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="readyAgain"
                        checked={readyAgain === option.value}
                        onChange={() => setReadyAgainChoice(option.value)}
                        className="sr-only"
                      />
                      {readyAgain === option.value && <CircleCheck className="h-4 w-4 shrink-0" />}
                      {option.label}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-amber-900">
                  {readyAgainOn
                    ? `${bnDate(readyAgainOn)} থেকে আপনার প্রোফাইল নিজে থেকেই আবার সার্চে দেখাবে।`
                    : "আপনি নিজে আবার \"রক্ত দিতে প্রস্তুত\" না করা পর্যন্ত প্রোফাইল সার্চে দেখাবে না।"}
                </p>
              </div>
            )}
            <span className="mt-1 block text-[10px] text-slate-500">
              শেষ রক্তদানের পর ৩ মাস না হলে &quot;প্রস্তুত&quot; দিলেও আপনার প্রোফাইল ৩ মাস পূর্ণ হওয়ার আগে সার্চে দেখাবে না।
            </span>
          </fieldset>

          {error && <p className="col-span-2 text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            {verified ? "পরবর্তী: তথ্য সংরক্ষণ" : "পরবর্তী: নাম্বার যাচাই"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <div className="mt-6">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50">
              <MessageSquareText className="h-7 w-7 text-red-600" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900">মোবাইল নাম্বার যাচাই করুন</h2>
            <p className="mt-1 text-xs text-slate-600">নিচের নাম্বারে SMS-এ পাঠানো ৬ ডিজিটের কোডটি লিখুন</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-sm font-semibold text-slate-800">
              <Phone className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" />
              +88 {prettyPhone(phone)}
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyAndSave(code);
            }}
            className="mt-6 space-y-4"
          >
            {verified ? (
              <p className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                নাম্বারটি যাচাই করা হয়েছে। তথ্য সংরক্ষণ করুন।
              </p>
            ) : (
              <>
                <OtpInput
                  value={code}
                  disabled={loading}
                  invalid={Boolean(error)}
                  onChange={(next) => {
                    setCode(next);
                    setError("");
                    if (next.length === 6) verifyAndSave(next);
                  }}
                />
                <p className="text-center text-[11px] text-slate-500">
                  {secondsLeft > 0 ? (
                    <>
                      কোডের মেয়াদ বাকি{" "}
                      <span className="font-mono font-semibold text-slate-700">{clock(secondsLeft)}</span> মিনিট
                    </>
                  ) : (
                    <span className="font-semibold text-red-600">কোডের মেয়াদ শেষ। নতুন কোড পাঠান।</span>
                  )}
                </p>
              </>
            )}

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600">{error}</p>
            ) : (
              notice && !verified && <p className="text-center text-xs text-emerald-700">{notice}</p>
            )}

            <button
              type="submit"
              disabled={loading || (!verified && (code.length !== 6 || secondsLeft === 0))}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700 disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {verified ? "তথ্য সংরক্ষণ করুন" : "যাচাই করে সংরক্ষণ করুন"}
            </button>

            {!verified && (
              <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
                কোড পাননি?
                {resendIn > 0 ? (
                  <span>
                    <span className="font-mono font-semibold text-slate-700">{toBanglaNumber(resendIn)}</span> সেকেন্ড পর আবার
                    পাঠাতে পারবেন
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={resending}
                    className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
                  >
                    <RotateCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                    আবার কোড পাঠান
                  </button>
                )}
              </p>
            )}
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">যে তথ্য সংরক্ষণ হবে</span>
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setCode("");
                  setError("");
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-red-600"
              >
                <Pencil className="h-3 w-3" />
                পরিবর্তন করুন
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded-md bg-red-50 px-2.5 py-1 text-sm font-bold text-red-700">{bloodGroup}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{shownName || name}</p>
                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="h-3 w-3 text-red-500" />
                  {formatLocation(district, thana)}
                  <span className="text-slate-300">•</span>
                  <span className={isReadyToDonate ? "text-emerald-600" : "text-amber-600"}>
                    {isReadyToDonate ? "রক্ত দিতে প্রস্তুত" : readyAgainOn ? `প্রস্তুত: ${bnDate(readyAgainOn)} থেকে` : "এখন প্রস্তুত নই"}
                  </span>
                </p>
              </div>
            </div>
            {shownName && shownName !== name.trim() && (
              <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] leading-relaxed text-slate-500">
                ওয়েবসাইটে নামটি বাংলায় এভাবে দেখাবে। বানান ভুল হলে &quot;পরিবর্তন করুন&quot; চেপে নামটি নিজেই বাংলায় লিখুন।
              </p>
            )}
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="mt-6 flex flex-col items-center rounded-xl bg-emerald-50 px-4 py-8 text-center">
          <CircleCheck className="h-10 w-10 text-emerald-600" />
          <p className="mt-3 font-bold text-slate-900">ধন্যবাদ, {shownName || name}!</p>
          <p className="mt-1 text-sm text-slate-600">{successMessage}</p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            যাচাইকৃত নাম্বার: {prettyPhone(phone)}
          </span>
          <AppInstallButton className="mt-5" />
          {isReadyToDonate && verification && (
            <PushOfferCard
              className="mt-5 w-full max-w-md"
              title="আবার রক্ত দেওয়ার সময় হলে মনে করিয়ে দিই?"
              text="শেষ রক্তদানের ৯০ দিন পূর্ণ হলে আর আপনার এলাকায় জরুরি রক্ত লাগলে নোটিফিকেশন পাবেন।"
              onEnabled={(endpoint) => linkPushDevice(endpoint, verification.token).then(() => {}).catch(() => {})}
            />
          )}
        </div>
      )}
    </section>
  );
}
