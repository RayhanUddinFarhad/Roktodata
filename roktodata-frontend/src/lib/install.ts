// The browser's "install this app" prompt. Chrome/Edge fire `beforeinstallprompt` once, early, on
// whatever page the visitor lands on, so it is caught here (by PwaSetup in the root layout) and kept
// until the install page's button asks for it.
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
let installed = false;
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

export function captureInstallPrompt() {
  if (window.__rdInstall) {
    deferred = window.__rdInstall;
    notify();
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // no mini-infobar; the site's own button shows the prompt
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    notify();
  });
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type InstallState = "installed" | "ready" | "unavailable";

export function installState(): InstallState {
  if (installed || window.matchMedia("(display-mode: standalone)").matches) return "installed";
  return deferred ? "ready" : "unavailable";
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
