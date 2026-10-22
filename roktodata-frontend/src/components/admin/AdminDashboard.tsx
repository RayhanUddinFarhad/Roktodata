"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CircleCheck,
  CircleX,
  Clock,
  ClipboardList,
  IdCard,
  LogOut,
  PhoneCall,
  MessageSquareWarning,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import LogoMark from "@/components/Logo";
import AddDonorPanel from "@/components/admin/AddDonorPanel";
import ComplaintsPanel from "@/components/admin/ComplaintsPanel";
import DonorsPanel from "@/components/admin/DonorsPanel";
import FraudTab from "@/components/admin/FraudTab";
import PushPanel from "@/components/admin/PushPanel";
import RequestsPanel from "@/components/admin/RequestsPanel";
import { ApiError, getAdminStats, type AdminStats } from "@/lib/api";

type Tab = "pending" | "donors" | "hidden" | "add" | "requests" | "fraud" | "complaints" | "push";

export interface AdminContext {
  token: string;
  refreshKey: number;
  // Runs an admin action, shows its result message and refreshes lists and stats. Resolves to whether it succeeded.
  runAction: (action: () => Promise<{ message: string }>) => Promise<boolean>;
  // Reports a failed load (logs out on an expired session).
  onError: (err: unknown) => void;
}

export default function AdminDashboard({
  token,
  onLogout,
  onSessionExpired,
}: {
  token: string;
  onLogout: () => void;
  onSessionExpired: () => void;
}) {
  const [tab, setTab] = useState<Tab>("pending");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const onError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) return onSessionExpired();
      setToast({ ok: false, text: err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে।" });
    },
    [onSessionExpired],
  );

  const runAction = useCallback(
    async (action: () => Promise<{ message: string }>) => {
      try {
        const { message } = await action();
        setToast({ ok: true, text: message });
        setRefreshKey((key) => key + 1);
        return true;
      } catch (err) {
        onError(err);
        return false;
      }
    },
    [onError],
  );

  useEffect(() => {
    getAdminStats(token)
      .then(({ stats }) => setStats(stats))
      .catch(onError);
  }, [token, refreshKey, onError]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const ctx: AdminContext = { token, refreshKey, runAction, onError };

  const statCards = [
    { label: "অনুমোদনের অপেক্ষায়", value: stats?.pending, icon: Clock, tone: "bg-amber-100 text-amber-700" },
    { label: "অনুমোদিত ডোনার", value: stats?.active, icon: UserCheck, tone: "bg-emerald-100 text-emerald-700" },
    { label: "ব্লক করা ডোনার", value: stats?.blocked, icon: UserX, tone: "bg-slate-200 text-slate-700" },
    { label: "খোলা অভিযোগ", value: stats?.openComplaints, icon: MessageSquareWarning, tone: "bg-red-100 text-red-600" },
    { label: "অপেক্ষমাণ রক্তের অনুরোধ", value: stats?.pendingRequests, icon: ClipboardList, tone: "bg-blue-100 text-indigo-900" },
    { label: "অপেক্ষমাণ প্রতারণার রিপোর্ট", value: stats?.pendingFraudReports, icon: ShieldAlert, tone: "bg-rose-100 text-rose-700" },
    { label: "তৈরি হওয়া ফটোকার্ড", value: stats?.photoCards, icon: IdCard, tone: "bg-fuchsia-100 text-fuchsia-700" },
  ];

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "pending", label: "অনুমোদনের অপেক্ষায়", count: stats?.pending },
    { id: "donors", label: "সকল ডোনার" },
    { id: "hidden", label: "লুকানো ডোনার", count: stats?.hiddenDonors },
    { id: "add", label: "+ ডোনার যোগ করুন" },
    { id: "requests", label: "রক্তের অনুরোধ", count: stats?.pendingRequests },
    { id: "fraud", label: "প্রতারণার রিপোর্ট", count: stats?.pendingFraudReports },
    { id: "complaints", label: "অভিযোগসমূহ", count: stats?.openComplaints },
    { id: "push", label: "নোটিফিকেশন" },
  ];

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <header className="bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-9 w-9" gradient="bg-red-600" />
            <span className="leading-tight">
              <span className="block text-lg font-bold">রক্তদাতা</span>
              <span className="block text-[10px] tracking-[0.15em] text-red-200">ADMIN PANEL</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            লগআউট
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 text-2xl font-bold text-slate-900">{value ?? "–"}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* taps on donors' call / WhatsApp buttons */}
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-bold text-slate-900">ডোনারদের সাথে যোগাযোগ</h2>
            <p className="text-xs text-slate-500">সাইটে ডোনারের &quot;কল করুন&quot; ও &quot;WhatsApp&quot; বাটনে চাপের হিসাব</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {([["today", "আজ"], ["week", "গত ৭ দিন"], ["total", "মোট"]] as const).map(([key, label]) => {
              const c = stats?.contacts?.[key];
              return (
                <div key={key} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm text-slate-700">
                      <PhoneCall className="h-4 w-4 text-emerald-700" />
                      <strong className="text-lg text-slate-900">{c?.call ?? "–"}</strong> কল
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-slate-700">
                      <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                      <strong className="text-lg text-slate-900">{c?.whatsapp ?? "–"}</strong> WhatsApp
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{c ? `${c.donors} জন ডোনারের সাথে` : "–"}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold ${
                tab === t.id ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
              {!!t.count && (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] leading-none text-white">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === "pending" && <DonorsPanel key="pending" ctx={ctx} fixedStatus="Pending" />}
          {tab === "donors" && <DonorsPanel key="donors" ctx={ctx} />}
          {tab === "hidden" && <DonorsPanel key="hidden" ctx={ctx} hidden />}
          {tab === "add" && <AddDonorPanel ctx={ctx} />}
          {tab === "requests" && <RequestsPanel ctx={ctx} />}
          {tab === "fraud" && <FraudTab ctx={ctx} />}
          {tab === "complaints" && <ComplaintsPanel ctx={ctx} />}
          {tab === "push" && <PushPanel ctx={ctx} push={stats?.push} />}
        </div>
      </main>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
            toast.ok ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.ok ? <CircleCheck className="h-4 w-4 shrink-0" /> : <CircleX className="h-4 w-4 shrink-0" />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
