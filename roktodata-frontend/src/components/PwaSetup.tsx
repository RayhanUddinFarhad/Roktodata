"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { captureInstallPrompt } from "@/lib/install";
import { canOfferPush, countVisit, dismissPushOffer, isInstalledApp, isIosBrowser } from "@/lib/pushOffer";

const NotifyPrompt = dynamic(() => import("@/components/NotifyPrompt"));

const IOS_KEY = "rd-ios-hint";
const IOS_AGAIN_MS = 7 * 24 * 60 * 60 * 1000;
// Pages with their own offer, or where a card would get in the way.
const QUIET_PATHS = ["/admin", "/app", "/blood-requests", "/register", "/patient-search", "/celebrate"];

type Offer = "notify" | "ios" | null;

// Which bottom card to show, if any: in the installed app, notifications on first open; in the
// browser, only from the second visit (asking strangers at once mostly gets "Block"); on an
// iPhone browser, where notifications need the app, how to add it to the home screen.
function pickOffer(visits: number): Offer {
  if (QUIET_PATHS.some((p) => window.location.pathname.startsWith(p))) return null;
  if (isInstalledApp()) return canOfferPush() ? "notify" : null;
  if (visits < 2) return null;
  if (canOfferPush()) return "notify";
  if (isIosBrowser()) {
    try {
      if (Date.now() - Number(localStorage.getItem(IOS_KEY) ?? 0) > IOS_AGAIN_MS) return "ios";
    } catch {}
  }
  return null;
}

// Registers the service worker (offline page, notifications), keeps the install prompt for the
// install buttons, refreshes the notification subscription of devices that allowed it, and shows
// the bottom card. The service worker is production-only, so local development never serves
// stale files.
export default function PwaSetup() {
  const [offer, setOffer] = useState<Offer>(null);

  useEffect(() => {
    captureInstallPrompt();
    const visits = countVisit();
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    // After the page has settled, so it never competes with what the visitor came for.
    const timer = setTimeout(
      () => {
        if ("Notification" in window && Notification.permission === "granted") {
          import("@/lib/push").then((m) => m.syncPush()).catch(() => {});
        } else {
          setOffer(pickOffer(visits));
        }
      },
      isInstalledApp() ? 2500 : 8000,
    );
    return () => clearTimeout(timer);
  }, []);

  if (!offer) return null;
  return (
    <NotifyPrompt
      mode={offer}
      onClose={() => {
        setOffer(null);
        if (offer === "notify") dismissPushOffer();
        else
          try {
            localStorage.setItem(IOS_KEY, String(Date.now()));
          } catch {}
      }}
    />
  );
}
