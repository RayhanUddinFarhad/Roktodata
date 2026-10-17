"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLogin from "@/components/admin/AdminLogin";

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

function writeToken(token: string | null) {
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

export default function AdminApp() {
  // undefined during server rendering, before the browser's storage can be read.
  const token = useSyncExternalStore(subscribe, readToken, () => undefined);
  const [notice, setNotice] = useState("");

  const login = useCallback((newToken: string) => {
    setNotice("");
    writeToken(newToken);
  }, []);

  const logout = useCallback((message = "") => {
    setNotice(message);
    writeToken(null);
  }, []);

  if (token === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return token ? (
    <AdminDashboard
      token={token}
      onLogout={() => logout()}
      onSessionExpired={() => logout("লগইনের মেয়াদ শেষ হয়েছে। আবার লগইন করুন।")}
    />
  ) : (
    <AdminLogin onLogin={login} notice={notice} />
  );
}
