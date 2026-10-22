"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "@/lib/install";

// Registers the service worker (offline page, faster start) and keeps the install prompt for the
// "অ্যাপ ডাউনলোড" page. Only in production builds, so local development never serves stale files.
export default function PwaSetup() {
  useEffect(() => {
    captureInstallPrompt();
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
