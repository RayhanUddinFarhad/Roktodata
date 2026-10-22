"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { installState, promptInstall, subscribeInstall } from "@/lib/install";

// "Get the app" under the photo card invitation, styled like it. Installs in one tap where the
// browser allows it, otherwise opens /app with the steps for that phone. Hidden once installed.
export default function AppBanner() {
  const state = useSyncExternalStore(subscribeInstall, installState, () => "unavailable" as const);
  if (state === "installed") return null;

  const content = (
    <>
      <Image src="/icons/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full sm:h-14 sm:w-14" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-base font-bold text-slate-900 sm:text-lg">রক্তদাতা অ্যাপ ফোনে রাখুন</span>
        <span className="mt-0.5 block text-sm text-slate-600">এক চাপে ডোনার খুঁজুন, আশেপাশে রক্ত লাগলে নোটিফিকেশন পান</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-indigo-900 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-900/30 group-hover:bg-indigo-950">
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">ইনস্টল</span>
      </span>
    </>
  );
  const box =
    "group mx-auto flex w-full max-w-[808px] items-center gap-4 overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-r from-[#eef2ff] via-white to-[#fff1f2] p-4 shadow-sm transition hover:shadow-md sm:gap-6 sm:p-5";

  return (
    <section className="px-4 pb-4">
      {state === "ready" ? (
        <button type="button" onClick={() => promptInstall()} className={box}>
          {content}
        </button>
      ) : (
        <Link href="/app" className={box}>
          {content}
        </Link>
      )}
    </section>
  );
}
