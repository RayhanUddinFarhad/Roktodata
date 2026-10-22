// When to offer notifications. Our own card asks first; the browser's permission dialog only
// appears after the visitor taps "চালু করুন", so a "not now" never turns into a permanent block.
// Tiny and dependency-free: it runs on every page, while lib/push.ts loads only when needed.

const ASK_KEY = "rd-push-ask";
const ASK_AGAIN_MS = 3 * 24 * 60 * 60 * 1000;
const VISITS_KEY = "rd-visits";

export function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

export function isIosBrowser() {
  const ua = navigator.userAgent;
  return (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) && !isInstalledApp();
}

function recentlyDismissed() {
  try {
    return Date.now() - Number(localStorage.getItem(ASK_KEY) ?? 0) < ASK_AGAIN_MS;
  } catch {
    return false;
  }
}

// Notifications can be offered: supported here, not yet allowed or blocked, and not turned down lately.
export function canOfferPush() {
  return "PushManager" in window && "Notification" in window && Notification.permission === "default" && !recentlyDismissed();
}

export function dismissPushOffer() {
  try {
    localStorage.setItem(ASK_KEY, String(Date.now()));
  } catch {}
}

// Counts visits (one per browser session) and returns the count including this one.
export function countVisit() {
  try {
    if (!sessionStorage.getItem(VISITS_KEY)) {
      sessionStorage.setItem(VISITS_KEY, "1");
      localStorage.setItem(VISITS_KEY, String(Number(localStorage.getItem(VISITS_KEY) ?? 0) + 1));
    }
    return Number(localStorage.getItem(VISITS_KEY) ?? 1);
  } catch {
    return 1;
  }
}
