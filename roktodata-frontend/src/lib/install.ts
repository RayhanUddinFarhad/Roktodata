// Whether the app is installed, and the browser's "install this app" prompt. Chrome/Edge fire
// `beforeinstallprompt` once, early, on whatever page the visitor lands on (only while the app is
// not installed), so it is caught here (by PwaSetup in the root layout) and kept until an install
// button asks for it.
//
// Opening the site in the browser after installing must not offer the install again. The browser
// says so through getInstalledRelatedApps() (Chrome on Android and desktop, with the manifest's
// related_applications), and a note kept when the app was installed or opened covers browsers
// without it (the app and the browser share the site's storage on Android).
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
let installed = false;
// getInstalledRelatedApps() found the app; false once the install prompt shows it isn't installed.
let relatedInstalled: boolean | null = null;
const INSTALLED_KEY = "rd-app-installed";

function remember(value: boolean) {
  try {
    if (value) localStorage.setItem(INSTALLED_KEY, "1");
    else localStorage.removeItem(INSTALLED_KEY);
  } catch {}
}

function remembered() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

// Counts this device once for the admin panel's "app installs": when the browser reports the
// install, or the first time the app is opened (iPhones never report installs, and apps installed
// before counting began are caught this way). Retried on a later visit if it fails.
const COUNTED_KEY = "rd-app-counted";
function countInstall() {
  try {
    if (localStorage.getItem(COUNTED_KEY)) return;
    let device = localStorage.getItem("rd-device");
    if (!device) {
      device = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem("rd-device", device);
    }
    const ua = navigator.userAgent;
    const platform = /Android/i.test(ua) ? "android" : /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Windows|Macintosh|Linux|CrOS/i.test(ua) ? "desktop" : "other";
    import("@/lib/api")
      .then(({ reportAppInstall }) => reportAppInstall(device, platform))
      .then(() => localStorage.setItem(COUNTED_KEY, "1"))
      .catch(() => {});
  } catch {}
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

// Set by EARLY_INSTALL_CAPTURE when the prompt fired before React started.
declare global {
  interface Window {
    __rdInstall?: InstallPromptEvent;
  }
}

// Inline script for the root layout: catches the prompt even if it fires before the page hydrates.
export const EARLY_INSTALL_CAPTURE =
  "addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__rdInstall=e;})";

// The prompt only fires while the app is not installed, so it also clears an outdated note (the
// app was uninstalled).
function gotPrompt(e: InstallPromptEvent) {
  deferred = e;
  relatedInstalled = false;
  remember(false);
  notify();
}

export function captureInstallPrompt() {
  if (isStandalone()) {
    remember(true);
    countInstall();
  }
  if (window.__rdInstall) gotPrompt(window.__rdInstall);
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // no mini-infobar; the site's own button shows the prompt
    gotPrompt(e as InstallPromptEvent);
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    remember(true);
    countInstall();
    notify();
  });

  const nav = navigator as { getInstalledRelatedApps?: () => Promise<unknown[]> };
  nav
    .getInstalledRelatedApps?.()
    .then((apps) => {
      // Only a "yes" is trusted: an empty answer can also mean the browser couldn't tell, and an
      // uninstall is caught by the install prompt firing again.
      if (deferred || !apps.length) return;
      relatedInstalled = true;
      remember(true);
      countInstall();
      notify();
    })
    .catch(() => {});
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type InstallState = "installed" | "ready" | "unavailable";

export function installState(): InstallState {
  if (installed || isStandalone()) return "installed";
  if (deferred) return "ready";
  if (relatedInstalled ?? remembered()) return "installed";
  return "unavailable";
}

// Shows the browser's install dialog; true if the visitor installed.
export async function promptInstall() {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  notify();
  return outcome === "accepted";
}
