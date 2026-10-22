"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { installState, promptInstall, subscribeInstall } from "@/lib/install";

// A compact "get the app" button: installs in one tap where the browser allows it, otherwise opens
// /app with the steps for that phone. Shows nothing once the app is installed.
export default function AppInstallButton({ className = "" }: { className?: string }) {
  const state = useSyncExternalStore(subscribeInstall, installState, () => "unavailable" as const);
  if (state === "installed") return null;

  const style = `inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-900 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-900/25 hover:bg-indigo-950 ${className}`;
  const content = (
    <>
      <Download className="h-4 w-4" />
      রক্তদাতা অ্যাপ ডাউনলোড করুন
    </>
  );
  return state === "ready" ? (
    <button type="button" onClick={() => promptInstall()} className={style}>
      {content}
    </button>
  ) : (
    <Link href="/app" className={style}>
      {content}
    </Link>
  );
}
