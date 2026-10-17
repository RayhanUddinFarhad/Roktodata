"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import LogoMark from "@/components/Logo";
import { ApiError, adminLogin } from "@/lib/api";

const fieldClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none";

export default function AdminLogin({ onLogin, notice }: { onLogin: (token: string) => void; notice: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await adminLogin(username.trim(), password);
      onLogin(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-12 w-12" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">অ্যাডমিন প্যানেল</h1>
          <p className="text-xs text-slate-500">রক্তদাতা (RoktoData) পরিচালনা</p>
        </div>

        {notice && <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{notice}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">ইউজারনেম</span>
            <input
              type="text"
              required
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">পাসওয়ার্ড</span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${fieldClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            লগইন করুন
          </button>
        </form>

        <Link href="/" className="mt-5 block text-center text-xs text-slate-500 hover:text-slate-800">
          ← মূল ওয়েবসাইটে ফিরে যান
        </Link>
      </div>
    </main>
  );
}
