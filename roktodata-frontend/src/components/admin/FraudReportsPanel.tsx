"use client";

import { useEffect, useState } from "react";
import { Ban, Check, Phone, RotateCw, Trash2, UserRound, X } from "lucide-react";
import type { AdminContext } from "@/components/admin/AdminDashboard";
import {
  ActionButton,
  DonorStatusBadge,
  FRAUD_STATUS_LABELS,
  FraudStatusBadge,
  ListState,
  Pagination,
  formatDate,
} from "@/components/admin/ui";
import {
  deleteFraudReport,
  getAdminFraudReports,
  setDonorStatus,
  setFraudReportStatus,
  type AdminFraudReport,
} from "@/lib/api";
import { toBanglaNumber, type FraudReportStatus } from "@/lib/data";

// User-submitted fraud reports: approving one lists the number on the public "প্রতারক ডোনার" page.
export default function FraudReportsPanel({ ctx }: { ctx: AdminContext }) {
  const { token, refreshKey, runAction, onError } = ctx;
  const [status, setStatus] = useState<FraudReportStatus | "">("Pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ reports: AdminFraudReport[]; total: number; pages: number } | null>(null);
  // Loading until the response for the current filter/page/refresh has arrived.
  const requestKey = `${refreshKey}|${status}|${page}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminFraudReports(token, { status: status || undefined, page })
      .then((result) => {
        if (cancelled) return;
        // Acting on the last item of a page can leave it empty; step back a page.
        if (result.reports.length === 0 && page > 1) return setPage(page - 1);
        setData(result);
        setLoadedKey(requestKey);
      })
      .catch((err) => {
        if (cancelled) return;
        onError(err);
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [token, requestKey, status, page, onError]);

  async function act(report: AdminFraudReport, action: () => Promise<{ message: string }>) {
    setBusyId(report.id);
    await runAction(action);
    setBusyId(null);
  }

  const changeStatus = (report: AdminFraudReport, next: FraudReportStatus) =>
    act(report, () => setFraudReportStatus(token, report.id, next));

  const reports = data?.reports ?? [];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          অনুমোদন দিলে নাম্বারটি &quot;প্রতারক ডোনার&quot; পাতায় দেখানো হবে। মোট {data?.total ?? "…"}টি
        </p>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as FraudReportStatus | "");
            setPage(1);
          }}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none sm:w-48"
        >
          <option value="">সকল রিপোর্ট</option>
          {Object.entries(FRAUD_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <ListState loading={loading} empty={reports.length === 0} emptyText="কোনো রিপোর্ট নেই।" />

      <ul className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
        {reports.map((report) => {
          const busy = busyId === report.id;
          const { donor } = report;
          return (
            <li key={report.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-red-600">{report.phoneNumber}</span>
                  <span className="font-semibold text-slate-900">{report.name}</span>
                  <FraudStatusBadge status={report.status} />
                  {report.approvedReportsForNumber > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                      এই নাম্বারে {toBanglaNumber(report.approvedReportsForNumber)}টি অনুমোদিত রিপোর্ট
                    </span>
                  )}
                </p>
                <span className="text-xs text-slate-400">{formatDate(report.createdAt)}</span>
              </div>

              <p className="mt-2 text-sm font-semibold text-red-700">{report.reasonLabel}</p>
              <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {report.details}
              </p>

              <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="font-semibold text-slate-500">রিপোর্টকারী (প্রকাশ করা হয় না)</p>
                  <a
                    href={`tel:${report.reporterPhone}`}
                    className="mt-1 flex items-center gap-1 font-mono text-slate-700 hover:text-slate-900"
                  >
                    <Phone className="h-3 w-3" />
                    {report.reporterPhone}
                  </a>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="font-semibold text-slate-500">এই নাম্বারে নিবন্ধিত ডোনার</p>
                  {donor ? (
                    <p className="mt-1 flex flex-wrap items-center gap-2">
                      <UserRound className="h-3 w-3 text-slate-400" />
                      <span className="font-semibold text-slate-900">{donor.fullName}</span>
                      <span className="text-slate-500">({donor.bloodGroup})</span>
                      <DonorStatusBadge status={donor.status} />
                    </p>
                  ) : (
                    <p className="mt-1 text-slate-400">কোনো নিবন্ধিত ডোনার নেই</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {donor && donor.status !== "Blocked" && (
                  <ActionButton
                    tone="red"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`${donor.fullName}-কে ব্লক করবেন? ব্লক করলে ওয়েবসাইটে দেখা যাবে না।`)) {
                        act(report, () => setDonorStatus(token, donor.id, "Blocked"));
                      }
                    }}
                  >
                    <Ban className="h-3.5 w-3.5" /> ডোনার ব্লক করুন
                  </ActionButton>
                )}
                {report.status === "Pending" && (
                  <>
                    <ActionButton tone="green" disabled={busy} onClick={() => changeStatus(report, "Approved")}>
                      <Check className="h-3.5 w-3.5" /> অনুমোদন দিন
                    </ActionButton>
                    <ActionButton tone="outlineRed" disabled={busy} onClick={() => changeStatus(report, "Rejected")}>
                      <X className="h-3.5 w-3.5" /> বাতিল
                    </ActionButton>
                  </>
                )}
                {report.status === "Approved" && (
                  <ActionButton tone="gray" disabled={busy} onClick={() => changeStatus(report, "Rejected")}>
                    <X className="h-3.5 w-3.5" /> তালিকা থেকে সরান
                  </ActionButton>
                )}
                {report.status === "Rejected" && (
                  <ActionButton tone="gray" disabled={busy} onClick={() => changeStatus(report, "Pending")}>
                    <RotateCw className="h-3.5 w-3.5" /> আবার রিভিউ
                  </ActionButton>
                )}
                <ActionButton
                  tone="gray"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("রিপোর্টটি স্থায়ীভাবে মুছে ফেলবেন?")) {
                      act(report, () => deleteFraudReport(token, report.id));
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> মুছুন
                </ActionButton>
              </div>
            </li>
          );
        })}
      </ul>

      <Pagination page={page} pages={data?.pages ?? 1} onPage={setPage} />
    </section>
  );
}
