"use client";

import { useSyncExternalStore } from "react";

const TOKEN_KEY = "roktodata-admin-token";
const TOKEN_EVENT = "roktodata-admin-token-change";

// The token lives in sessionStorage, so closing the tab logs the admin out.
// If storage is blocked, it is kept in memory for this page load instead.
let memoryToken: string | null = null;

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return memoryToken;
  }
}

export function writeAdminToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(TOKEN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(TOKEN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// The logged-in admin's token, null when logged out, undefined during server rendering.
export function useAdminToken() {
  return useSyncExternalStore(subscribe, readToken, () => undefined);
}
