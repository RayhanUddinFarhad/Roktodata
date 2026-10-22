"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, CircleCheck, Copy, Download, EllipsisVertical, Loader2, Share, SquarePlus } from "lucide-react";
import { installState, promptInstall, subscribeInstall, type InstallState } from "@/lib/install";

type Platform = "ios" | "inapp" | "android" | "desktop";

// Facebook, Messenger and Instagram open links in their own browser, which can't install apps.
function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\//i.test(ua)) return "inapp";
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

const noop = () => () => {};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">{n}</span>
      <span className="pt-0.5 text-sm leading-relaxed text-slate-700">{children}</span>
    </li>
  );
}

// The install box on /app: one button where the browser allows it, otherwise the steps for the
// visitor's own phone and browser.
export default function InstallApp() {
  const state = useSyncExternalStore<InstallState | null>(subscribeInstall, installState, () => null);
  const platform = useSyncExternalStore<Platform | null>(noop, detectPlatform, () => null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!state || !platform) {
    return <div className="flex h-24 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  if (state === "installed") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CircleCheck className="h-12 w-12 text-emerald-600" />
        <p className="text-lg font-bold text-slate-900">অ্যাপটি ইনস্টল করা আছে</p>
        <p className="text-sm text-slate-600">ফোনের হোম স্ক্রিনে &quot;রক্তদাতা&quot; আইকনে চাপ দিলেই খুলবে।</p>
      </div>
    );
  }

  if (state === "ready") {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await promptInstall();
            setBusy(false);
          }}
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          অ্যাপ ইনস্টল করুন
        </button>
        <p className="text-xs text-slate-500">মাত্র কয়েক সেকেন্ড লাগে, প্লে স্টোরে যেতে হবে না।</p>
      </div>
    );
  }

  if (platform === "inapp") {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
          ফেসবুক বা মেসেঞ্জারের ভেতর থেকে অ্যাপ ইনস্টল করা যায় না। পাতাটা <b>Chrome</b>-এ খুলুন:
        </p>
        <ol className="space-y-3">
          <Step n={1}>
            উপরের কোণে <EllipsisVertical className="inline h-4 w-4 align-[-3px]" /> বা <b>⋯</b> চিহ্নে চাপ দিন।
          </Step>
          <Step n={2}>
            <b>&quot;Open in Chrome&quot;</b> বা <b>&quot;ব্রাউজারে খুলুন&quot;</b> বেছে নিন।
          </Step>
          <Step n={3}>Chrome-এ খোলার পর এই পাতায় &quot;অ্যাপ ইনস্টল করুন&quot; বাটন আসবে।</Step>
        </ol>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
            } catch {}
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "লিংক কপি হয়েছে, Chrome-এ পেস্ট করুন" : "লিংক কপি করুন"}
        </button>
      </div>
    );
  }

  if (platform === "ios") {
    return (
      <ol className="space-y-3">
        <Step n={1}>পাতাটা <b>Safari</b>-তে খুলুন।</Step>
        <Step n={2}>
          নিচের <Share className="inline h-4 w-4 align-[-3px] text-blue-600" /> <b>Share</b> বাটনে চাপ দিন।
        </Step>
        <Step n={3}>
          একটু নিচে গিয়ে <SquarePlus className="inline h-4 w-4 align-[-3px]" /> <b>&quot;Add to Home Screen&quot;</b> বেছে নিন, তারপর <b>Add</b>।
        </Step>
      </ol>
    );
  }

  return (
    <ol className="space-y-3">
      <Step n={1}>
        পাতাটা <b>Chrome</b>{platform === "desktop" && " বা Edge"}-এ খুলুন।
      </Step>
      <Step n={2}>
        {platform === "android" ? "উপরের কোণে" : "অ্যাড্রেস বারের ডানে বা মেনুতে"}{" "}
        <EllipsisVertical className="inline h-4 w-4 align-[-3px]" /> চিহ্নে চাপ দিন।
      </Step>
      <Step n={3}>
        <b>&quot;Install app&quot;</b> বা <b>&quot;Add to Home screen&quot;</b> বেছে নিন।
      </Step>
    </ol>
  );
}
