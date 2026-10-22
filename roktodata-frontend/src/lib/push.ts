// Notifications on this device: turning them on, keeping the subscription and its area fresh, and
// turning them off. Loaded only when needed (the prompt, the /app page, or a device that already
// allowed notifications), so ordinary page loads don't pay for it.
import { deletePushSubscription, getPushKey, savePushSubscription } from "@/lib/api";

export type PushStatus = "unsupported" | "denied" | "off" | "on";

const SYNC_KEY = "rd-push-sync";
const SYNC_EVERY_MS = 6 * 60 * 60 * 1000;

// iPhones only support notifications for apps added to the home screen.
export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function registration() {
  return navigator.serviceWorker.getRegistration().then((r) => r ?? navigator.serviceWorker.register("/sw.js"));
}

async function currentSubscription() {
  return (await registration()).pushManager.getSubscription();
}

export async function pushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "off";
  return (await currentSubscription()) ? "on" : "off";
}

function keyBytes(base64url: string) {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function subscription() {
  const existing = await currentSubscription();
  if (existing) return existing;
  const { publicKey } = await getPushKey();
  const reg = await registration();
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
}

async function ipLocation(): Promise<{ lat?: number; lng?: number }> {
  try {
    return await (await fetch("/api/geo", { cache: "no-store" })).json();
  } catch {
    return {};
  }
}

async function save(district?: string) {
  const sub = await subscription();
  const result = await savePushSubscription({ subscription: sub.toJSON(), ...(district ? { district } : await ipLocation()) });
  try {
    localStorage.setItem(SYNC_KEY, String(Date.now()));
  } catch {}
  return result;
}

// Asks for permission (call it straight from a tap) and subscribes. Returns the area the
// notifications are for, or null if the visitor declined.
export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  return save();
}

// For devices that already allowed notifications: makes sure they're subscribed and refreshes the
// area from the current IP address, at most every few hours.
export async function syncPush() {
  if (!pushSupported() || Notification.permission !== "granted") return;
  try {
    if (Date.now() - Number(localStorage.getItem(SYNC_KEY) ?? 0) < SYNC_EVERY_MS && (await currentSubscription())) return;
  } catch {}
  await save();
}

// Refreshes the subscription and returns the area its notifications are for.
export function pushArea() {
  return save();
}

// The visitor picks the district their blood-request notifications are for.
export function setPushDistrict(district: string) {
  return save(district);
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await deletePushSubscription(sub.endpoint).catch(() => {});
  await sub.unsubscribe();
}

// This device's notification address, if notifications are on (sent with a donor's registration).
export async function pushEndpoint() {
  if (!pushSupported() || Notification.permission !== "granted") return undefined;
  return (await currentSubscription())?.endpoint;
}
