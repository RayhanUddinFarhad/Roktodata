"use client";

import { useEffect, useState } from "react";
import { Ban, CalendarDays, Check, MapPin, MessageSquareWarning, Phone, RotateCw, Search, Trash2 } from "lucide-react";
import type { AdminContext } from "@/components/admin/AdminDashboard";
import {
  ActionButton,
  askBlockReason,
  DONOR_STATUS_LABELS,
  DonorStatusBadge,
  ListState,
  Pagination,
  formatDate,
} from "@/components/admin/ui";
import { deleteDonor, getAdminDonors, setDonorStatus, type AdminDonor } from "@/lib/api";
import { type DonorStatus, formatLocation, NOT_MENTIONED } from "@/lib/data";

// Lists donors. With fixedStatus="Pending" it is the approval queue; otherwise it has a status filter and search.
export default function DonorsPanel({ ctx, fixedStatus }: { ctx: AdminContext; fixedStatus?: DonorStatus }) {
  const { token, refreshKey, runAction, onError } = ctx;
  const [status, setStatus] = useState<DonorStatus | "">(fixedStatus ?? "");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ donors: AdminDonor[]; total: number; pages: number } | null>(null);
  // Loading until the response for the current filters/page/refresh has arrived.
  const requestKey = `${refreshKey}|${status}|${debouncedQuery}|${page}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    getAdminDonors(token, { status: status || undefined, q: debouncedQuery || undefined, page })
      .then((result) => {
        if (cancelled) return;
        // Acting on the last item of a page can leave it empty; step back a page.
        if (result.donors.length === 0 && page > 1) return setPage(page - 1);
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
  }, [token, requestKey, status, debouncedQuery, page, onError]);

  async function act(donor: AdminDonor, action: () => Promise<{ message: string }>) {
    setBusyId(donor.id);
    await runAction(action);
    setBusyId(null);
  }

  const changeStatus = (donor: AdminDonor, next: DonorStatus) => act(donor, () => setDonorStatus(token, donor.id, next));

  const remove = (donor: AdminDonor, question: string) => {
    if (window.confirm(question)) act(donor, () => deleteDonor(token, donor.id));
  };

  const donors = data?.donors ?? [];

  return (
    <section>
      {!fixedStatus && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="নাম বা মোবাইল নাম্বার দিয়ে খুঁজুন"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-red-500 focus:outline-none"
            />
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as DonorStatus | "");
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none sm:w-48"
          >
            <option value="">সকল স্ট্যাটাস</option>
            {Object.entries(DONOR_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="mb-3 text-sm text-slate-500">
        {fixedStatus
          ? "নতুন রেজিস্ট্রেশনগুলো যাচাই করে অনুমোদন দিন। অনুমোদনের আগে এরা ওয়েবসাইটে দেখা যাবে না।"
          : `মোট ${data?.total ?? "…"} জন ডোনার`}
      </p>

      <ListState
        loading={loading}
        empty={donors.length === 0}
        emptyText={fixedStatus ? "অনুমোদনের অপেক্ষায় কোনো ডোনার নেই।" : "কোনো ডোনার পাওয়া যায়নি।"}
      />

      <ul className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
        {donors.map((donor) => {
          const busy = busyId === donor.id;
          return (
            <li key={donor.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{donor.bloodGroup}</span>
                    <span className="font-bold text-slate-900">{donor.fullName}</span>
                    <DonorStatusBadge status={donor.status} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        donor.isReadyToDonate ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {donor.isReadyToDonate ? "রক্ত দিতে প্রস্তুত" : "প্রস্তুত নন"}
                    </span>
                    {donor.openComplaints > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                        <MessageSquareWarning className="h-3 w-3" />
                        {donor.openComplaints}টি অভিযোগ
                      </span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <a href={`tel:${donor.phoneNumber}`} className="flex items-center gap-1 font-mono hover:text-slate-800">
                      <Phone className="h-3 w-3" />
                      {donor.phoneNumber}
                    </a>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formatLocation(donor.district, donor.upazila)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      শেষ রক্তদান: {donor.lastDonationDate ?? NOT_MENTIONED}
                    </span>
                    <span>রেজিস্ট্রেশন: {formatDate(donor.createdAt)}</span>
                  </div>
                  {donor.status === "Blocked" && donor.blockReason && (
                    <p className="mt-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
                      ব্লকের কারণ (প্রতারক তালিকায় দেখানো হচ্ছে): {donor.blockReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {donor.status === "Pending" && (
                    <>
                      <ActionButton tone="green" disabled={busy} onClick={() => changeStatus(donor, "Active")}>
                        <Check className="h-3.5 w-3.5" /> অনুমোদন দিন
                      </ActionButton>
                      <ActionButton
                        tone="outlineRed"
                        disabled={busy}
                        onClick={() => remove(donor, `${donor.fullName}-এর রেজিস্ট্রেশন বাতিল করে মুছে ফেলবেন?`)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> বাতিল
                      </ActionButton>
                    </>
                  )}
                  {donor.status === "Active" && (
                    <ActionButton
                      tone="red"
                      disabled={busy}
                      onClick={() => {
                        const reason = askBlockReason(donor.fullName);
                        if (reason) act(donor, () => setDonorStatus(token, donor.id, "Blocked", reason));
                      }}
                    >
                      <Ban className="h-3.5 w-3.5" /> ব্লক করুন
                    </ActionButton>
                  )}
                  {donor.status === "Blocked" && (
                    <ActionButton tone="green" disabled={busy} onClick={() => changeStatus(donor, "Active")}>
                      <RotateCw className="h-3.5 w-3.5" /> আনব্লক
                    </ActionButton>
                  )}
                  {donor.status !== "Pending" && (
                    <ActionButton
                      tone="gray"
                      disabled={busy}
                      onClick={() => remove(donor, `${donor.fullName}-এর সব তথ্য ও অভিযোগ স্থায়ীভাবে মুছে ফেলবেন?`)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> মুছুন
                    </ActionButton>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Pagination page={page} pages={data?.pages ?? 1} onPage={setPage} />
    </section>
  );
}
