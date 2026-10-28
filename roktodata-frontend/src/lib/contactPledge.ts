import type { MouseEvent } from "react";

// Before someone first calls or messages a donor, they agree to three rules (no advance money, look
// after the donor, behave well). The agreement is remembered on this device for PLEDGE_DAYS.
const KEY = "rd-contact-pledge";
const PLEDGE_DAYS = 30;

// The contact waiting for the agreement; null while nothing is asked. `href` is null when the rules
// were opened from the banner to read, with no call behind them.
export type PendingContact = { href: string | null; kind: "call" | "whatsapp" | null; onGo?: () => void };

let pending: PendingContact | null = null;
// Where storage is blocked, the agreement lasts until the page is closed.
let pledgedInMemory = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function subscribePledge(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const pendingContact = () => pending;

function hasPledged() {
  if (pledgedInMemory) return true;
  try {
    const at = Number(localStorage.getItem(KEY));
    return at > 0 && Date.now() - at < PLEDGE_DAYS * 24 * 3600e3;
  } catch {
    return false;
  }
}

// Click handler for a donor's call / WhatsApp link: lets it through once agreed, otherwise holds it
// and shows the rules. `onGo` runs when the contact really happens (e.g. counting the tap). With no
// rules sheet on the page the link always goes through.
export function guardContact(e: MouseEvent<HTMLAnchorElement>, kind: "call" | "whatsapp", onGo?: () => void) {
  if (listeners.size === 0 || hasPledged()) {
    onGo?.();
    return;
  }
  e.preventDefault();
  pending = { href: e.currentTarget.href, kind, onGo };
  emit();
}

export function showPledge() {
  pending = { href: null, kind: null };
  emit();
}

// "রাজি আছি": remembers the agreement and carries on with the held call or chat.
export function acceptPledge() {
  pledgedInMemory = true;
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {}
  const contact = pending;
  pending = null;
  emit();
  if (!contact?.href) return;
  contact.onGo?.();
  if (contact.kind === "whatsapp") window.open(contact.href, "_blank", "noopener,noreferrer");
  else window.location.href = contact.href;
}

export function closePledge() {
  pending = null;
  emit();
}
