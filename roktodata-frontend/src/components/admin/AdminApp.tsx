"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLogin from "@/components/admin/AdminLogin";
import { useAdminToken, writeAdminToken } from "@/lib/adminToken";

export default function AdminApp() {
  const token = useAdminToken();
  const [notice, setNotice] = useState("");

  const login = useCallback((newToken: string) => {
    setNotice("");
    writeAdminToken(newToken);
  }, []);

  const logout = useCallback((message = "") => {
    setNotice(message);
    writeAdminToken(null);
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
