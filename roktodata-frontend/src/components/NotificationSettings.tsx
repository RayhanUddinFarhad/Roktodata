"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, CircleCheck, Loader2, MapPin } from "lucide-react";
import { DISTRICTS } from "@/lib/data";
import { disablePush, enablePush, pushArea, pushStatus, setPushDistrict, type PushStatus } from "@/lib/push";

// Notification switch and area on the /app page.
export default function NotificationSettings() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [district, setDistrict] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pushStatus()
      .then(async (s) => {
        if (cancelled) return;
        setStatus(s);
        if (s === "on") {
          const area = await pushArea().catch(() => null);
          if (!cancelled && area?.district) setDistrict(area.district);
        }
      })
      .catch(() => !cancelled && setStatus("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await action();
    } catch {
      setError("কিছু একটা সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  if (!status) return <div className="flex h-16 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>;

  const heading = (
    <p className="flex items-center gap-2 font-bold text-slate-900">
      <BellRing className="h-5 w-5 text-red-600" />
      রক্তের অনুরোধের নোটিফিকেশন
    </p>
  );

  if (status === "unsupported") {
    return (
      <div>
        {heading}
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          এই ব্রাউজারে নোটিফিকেশন পাওয়া যায় না। আইফোনে আগে উপরের ধাপগুলো মেনে অ্যাপটি হোম স্ক্রিনে যোগ করুন, তারপর অ্যাপ থেকে এই পাতা খুলে চালু করুন।
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div>
        {heading}
        <p className="mt-2 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
          <BellOff className="mt-0.5 h-4 w-4 shrink-0" />
          নোটিফিকেশন বন্ধ করে রাখা আছে। চালু করতে ফোনের Settings → Apps → রক্তদাতা (বা Chrome) → Notifications চালু করুন, তারপর এই পাতাটি আবার খুলুন।
        </p>
      </div>
    );
  }

  if (status === "off") {
    return (
      <div>
        {heading}
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          আপনার এলাকায় কারো জরুরি রক্ত লাগলে নোটিফিকেশন পাবেন (দিনে সর্বোচ্চ ৩টি)। আপনি ডোনার হলে আবার রক্ত দিতে পারার সময় হলে মনে করিয়ে দেব।
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const result = await enablePush();
              if (!result) return setStatus(await pushStatus());
              setDistrict(result.district ?? "");
              setStatus("on");
            })
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
          নোটিফিকেশন চালু করুন
        </button>
      </div>
    );
  }

  return (
    <div>
      {heading}
      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
        <CircleCheck className="h-4 w-4" /> চালু আছে
      </p>
      <label className="mt-3 block">
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
          <MapPin className="h-3.5 w-3.5" /> যে এলাকার অনুরোধ জানতে চান (আশেপাশের প্রায় ৫০ কিমিসহ)
        </span>
        <select
          value={district}
          disabled={busy}
          onChange={(e) => {
            const next = e.target.value;
            setDistrict(next);
            run(async () => {
              await setPushDistrict(next);
              setSaved(true);
            });
          }}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none"
        >
          {!district && <option value="">আপনার অবস্থান থেকে</option>}
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      {saved && <p className="mt-2 text-xs text-emerald-700">এলাকা সংরক্ষণ হয়েছে।</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run(async () => {
            await disablePush();
            setStatus("off");
          })
        }
        className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
      >
        নোটিফিকেশন বন্ধ করুন
      </button>
    </div>
  );
}
