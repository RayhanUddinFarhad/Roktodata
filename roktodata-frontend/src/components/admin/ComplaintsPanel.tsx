"use client";

import { useEffect, useState } from "react";
import { Ban, Check, MapPin, Phone, RotateCw, X } from "lucide-react";
import type { AdminContext } from "@/components/admin/AdminDashboard";
import {
  ActionButton,
  COMPLAINT_STATUS_LABELS,
  ComplaintStatusBadge,
  DonorStatusBadge,
  ListState,
  Pagination,
  formatDate,
} from "@/components/admin/ui";
import { getAdminComplaints, setComplaintStatus, setDonorStatus, type AdminComplaint } from "@/lib/api";
import { type ComplaintStatus, formatLocation } from "@/lib/data";

export default function ComplaintsPanel({ ctx }: { ctx: AdminContext }) {
  const { token, refreshKey, runAction, onError } = ctx;
  const [status, setStatus] = useState<ComplaintStatus | "">("Open");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ complaints: AdminComplaint[]; total: number; pages: number } | null>(null);
  // Loading until the response for the current filter/page/refresh has arrived.
  const requestKey = `${refreshKey}|${status}|${page}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminComplaints(token, { status: status || undefined, page })
      .then((result) => {
        if (cancelled) return;
        // Acting on the last item of a page can leave it empty; step back a page.
        if (result.complaints.length === 0 && page > 1) return setPage(page - 1);
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

  async function act(complaint: AdminComplaint, action: () => Promise<{ message: string }>) {
    setBusyId(complaint.id);
    await runAction(action);
    setBusyId(null);
  }

  const complaints = data?.complaints ?? [];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">মোট {data?.total ?? "…"}টি অভিযোগ</p>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ComplaintStatus | "");
            setPage(1);
          }}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none sm:w-48"
        >
          <option value="">সকল অভিযোগ</option>
          {Object.entries(COMPLAINT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <ListState loading={loading} empty={complaints.length === 0} emptyText="কোনো অভিযোগ নেই।" />

      <ul className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
        {complaints.map((complaint) => {
          const busy = busyId === complaint.id;
          const { donor } = complaint;
          return (
            <li key={complaint.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">{complaint.reasonLabel}</span>
                  <ComplaintStatusBadge status={complaint.status} />
                </p>
                <span className="text-xs text-slate-400">{formatDate(complaint.createdAt)}</span>
              </div>

              {complaint.details && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{complaint.details}</p>
              )}

              <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="font-semibold text-slate-500">অভিযুক্ত ডোনার</p>
                  {donor ? (
                    <>
                      <p className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{donor.bloodGroup}</span>
                        <span className="font-semibold text-slate-900">{donor.fullName}</span>
                        <DonorStatusBadge status={donor.status} />
                      </p>
                      <p className="mt-1 flex flex-wrap gap-x-3 text-slate-500">
                        <a href={`tel:${donor.phoneNumber}`} className="flex items-center gap-1 font-mono hover:text-slate-800">
                          <Phone className="h-3 w-3" />
                          {donor.phoneNumber}
                        </a>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {formatLocation(donor.district, donor.upazila)}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-slate-400">ডোনারের তথ্য মুছে ফেলা হয়েছে</p>
                  )}
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="font-semibold text-slate-500">অভিযোগকারী</p>
                  <a
                    href={`tel:${complaint.complainantPhone}`}
                    className="mt-1 flex items-center gap-1 font-mono text-slate-700 hover:text-slate-900"
                  >
                    <Phone className="h-3 w-3" />
                    {complaint.complainantPhone}
                  </a>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {donor?.status === "Active" && (
                  <ActionButton
                    tone="red"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`${donor.fullName}-কে ব্লক করবেন? ব্লক করলে ওয়েবসাইটে দেখা যাবে না।`)) {
                        act(complaint, () => setDonorStatus(token, donor.id, "Blocked"));
                      }
                    }}
                  >
                    <Ban className="h-3.5 w-3.5" /> ডোনার ব্লক করুন
                  </ActionButton>
                )}
                {complaint.status === "Open" ? (
                  <>
                    <ActionButton
                      tone="green"
                      disabled={busy}
                      onClick={() => act(complaint, () => setComplaintStatus(token, complaint.id, "Resolved"))}
                    >
                      <Check className="h-3.5 w-3.5" /> সমাধান হয়েছে
                    </ActionButton>
                    <ActionButton
                      tone="gray"
                      disabled={busy}
                      onClick={() => act(complaint, () => setComplaintStatus(token, complaint.id, "Dismissed"))}
                    >
                      <X className="h-3.5 w-3.5" /> বাতিল
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton
                    tone="gray"
                    disabled={busy}
                    onClick={() => act(complaint, () => setComplaintStatus(token, complaint.id, "Open"))}
                  >
                    <RotateCw className="h-3.5 w-3.5" /> আবার খুলুন
                  </ActionButton>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Pagination page={page} pages={data?.pages ?? 1} onPage={setPage} />
    </section>
  );
}
