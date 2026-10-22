"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { captureInstallPrompt } from "@/lib/install";

const NotifyPrompt = dynamic(() => import("@/components/NotifyPrompt"));

const ASK_KEY = "rd-push-ask";
const ASK_AGAIN_MS = 3 * 24 * 60 * 60 * 1000;

// In the installed app, notifications are offered right away (browsers need one tap to allow them).
function shouldOfferNotifications() {
  const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (!installed || !("PushManager" in window) || !("Notification" in window) || Notification.permission !== "default") return false;
  if (window.location.pathname.startsWith("/admin")) return false;
  try {
    return Date.now() - Number(localStorage.getItem(ASK_KEY) ?? 0) > ASK_AGAIN_MS;
  } catch {
    return true;
  }
}

// Registers the service worker (offline page, notifications), keeps the install prompt for the
// "অ্যাপ ডাউনলোড" page, refreshes the notification subscription of devices that allowed it, and
// offers notifications in the installed app. The service worker is production-only, so local
// development never serves stale files.
export default function PwaSetup() {
  const [offer, setOffer] = useState(false);

  useEffect(() => {
    captureInstallPrompt();
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    // After the page has settled, so it never competes with what the visitor came for.
    const timer = setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        import("@/lib/push").then((m) => m.syncPush()).catch(() => {});
      } else if (shouldOfferNotifications()) {
        setOffer(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!offer) return null;
  return (
    <NotifyPrompt
      onClose={() => {
        setOffer(false);
        try {
          localStorage.setItem(ASK_KEY, String(Date.now()));
        } catch {}
      }}
    />
  );
}
