"use client";

import { useEffect, useState } from "react";
import { Ban, CalendarDays, Check, Eye, EyeOff, MapPin, MessageSquareWarning, Pencil, Phone, PhoneCall, RotateCw, Search, Trash2 } from "lucide-react";
import type { AdminContext } from "@/components/admin/AdminDashboard";
import EditDonorForm from "@/components/admin/EditDonorForm";
import {
  ActionButton,
  askBlockReason,
  DONOR_STATUS_LABELS,
  DonorStatusBadge,
  ListState,
  Pagination,
  formatDate,
} from "@/components/admin/ui";
import { deleteDonor, getAdminDonors, setDonorFraudListing, setDonorStatus, type AdminDonor } from "@/lib/api";
import { type DonorStatus, formatLocation, NOT_MENTIONED } from "@/lib/data";

// Lists donors. With fixedStatus="Pending" it is the approval queue, with fixedStatus="Blocked" the blocked
// donors behind the public fraud list; with hidden, the donors who chose "not ready" (most recently hidden
// first); otherwise it has a status filter and search.
const FIXED_TEXT: Partial<Record<DonorStatus, { intro: string; empty: string }>> = {
  Pending: {
    intro: "নতুন রেজিস্ট্রেশনগুলো যাচাই করে অনুমোদন দিন। অনুমোদনের আগে এরা ওয়েবসাইটে দেখা যাবে না।",
    empty: "অনুমোদনের অপেক্ষায় কোনো ডোনার নেই।",
  },
  Blocked: {
    intro:
      "ব্লক করা ডোনাররা কারণসহ \"প্রতারক ডোনার\" পাতায় দেখান। কাউকে সেখান থেকে সরাতে \"প্রতারক তালিকা থেকে সরান\" চাপুন; তিনি ব্লক অবস্থাতেই থাকবেন।",
    empty: "কোনো ব্লক করা ডোনার নেই।",
  },
};
export default function DonorsPanel({ ctx, fixedStatus, hidden = false }: { ctx: AdminContext; fixedStatus?: DonorStatus; hidden?: boolean }) {
  const { token, refreshKey, runAction, onError } = ctx;
  // Today in Bangladesh (YYYY-MM-DD), to tell whether a "not ready" donor's return date has come.
  const [today] = useState(() => new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10));
  const [status, setStatus] = useState<DonorStatus | "">(fixedStatus ?? "");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  // "contacts": the donors whose call / WhatsApp buttons were tapped most come first.
  const [sort, setSort] = useState<"" | "contacts">("");
  // In the hidden list: "oldest" shows who hid longest ago first.
  const [order, setOrder] = useState<"" | "oldest">("");
  const [data, setData] = useState<{ donors: AdminDonor[]; total: number; pages: number } | null>(null);
  // Loading until the response for the current filters/page/refresh has arrived.
  const requestKey = `${refreshKey}|${status}|${debouncedQuery}|${page}|${sort}|${order}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    getAdminDonors(token, { status: status || undefined, q: debouncedQuery || undefined, page, sort: sort || undefined, ready: hidden ? "hidden" : undefined, order: (hidden && order) || undefined })
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
  }, [token, requestKey, status, debouncedQuery, page, sort, hidden, order, onError]);

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
          {hidden && (
            <select
              value={order}
              onChange={(e) => {
                setOrder(e.target.value as "" | "oldest");
                setPage(1);
              }}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none sm:w-56"
            >
              <option value="">নতুন লুকানো আগে</option>
              <option value="oldest">পুরোনো লুকানো আগে</option>
            </select>
          )}
          {!hidden && (
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as "" | "contacts");
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none sm:w-56"
          >
            <option value="">নতুন ডোনার আগে</option>
            <option value="contacts">সবচেয়ে বেশি যোগাযোগ আগে</option>
          </select>
          )}
        </div>
      )}

      <p className="mb-3 text-sm text-slate-500">
        {fixedStatus
          ? FIXED_TEXT[fixedStatus]?.intro
          : hidden
            ? `যাঁরা "এখন প্রস্তুত নই" দিয়েছেন: মোট ${data?.total ?? "…"} জন। ফেরার তারিখ থাকলে সেদিন নিজে থেকেই তালিকায় ফেরেন।`
            : `মোট ${data?.total ?? "…"} জন ডোনার`}
      </p>

      <ListState
        loading={loading}
        empty={donors.length === 0}
        emptyText={(fixedStatus && FIXED_TEXT[fixedStatus]?.empty) || (hidden ? "কেউ নিজেকে লুকাননি।" : "কোনো ডোনার পাওয়া যায়নি।")}
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
                    {(() => {
                      // "Not ready" with a return date that has passed counts as ready again.
                      const back = !donor.isReadyToDonate && !!donor.readyAgainAt && donor.readyAgainAt <= today;
                      const ready = donor.isReadyToDonate || back;
                      return (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {donor.isReadyToDonate
                            ? "রক্ত দিতে প্রস্তুত"
                            : back
                              ? `আবার প্রস্তুত (${donor.readyAgainAt} থেকে)`
                              : donor.readyAgainAt
                                ? `প্রস্তুত নন · ফিরবেন ${donor.readyAgainAt}`
                                : "প্রস্তুত নন"}
                        </span>
                      );
                    })()}
                    {/* "Not ready" already has its own badge; this one is for the 90-day rule, alone or pushing the return date later. */}
                    {donor.searchHidden && (donor.searchHidden === "recent_donation" || donor.searchHiddenUntil !== donor.readyAgainAt) && (
                      <span
                        className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                        title="অনুমোদিত, কিন্তু এখন ওয়েবসাইটের সার্চে দেখাচ্ছে না"
                      >
                        <EyeOff className="h-3 w-3" />
                        {donor.searchHidden === "recent_donation" ? "৯০ দিন হয়নি · সাইটে দেখাচ্ছে না" : "সাইটে দেখাচ্ছে না"}
                        {donor.searchHiddenUntil ? ` · ${donor.searchHiddenUntil} থেকে দেখাবে` : ""}
                      </span>
                    )}
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
                    {!donor.isReadyToDonate && donor.notReadySince && (
                      <span className="flex items-center gap-1 font-semibold text-amber-700">
                        <EyeOff className="h-3 w-3" />
                        লুকিয়েছেন: {donor.notReadySince}
                      </span>
                    )}
                    <span className="flex items-center gap-1" title="সাইটে এই ডোনারের কল / WhatsApp বাটনে চাপ">
                      <PhoneCall className="h-3 w-3 text-emerald-700" />
                      কল {donor.contacts.call} · WhatsApp {donor.contacts.whatsapp}
                      {donor.lastContactedAt && <span className="text-slate-400">(শেষ: {formatDate(donor.lastContactedAt)})</span>}
                    </span>
                  </div>
                  {donor.status === "Blocked" && (
                    <p
                      className={`mt-2 rounded-md px-2.5 py-1.5 text-xs ${
                        donor.inFraudList ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span className="font-semibold">
                        {donor.inFraudList ? "প্রতারক তালিকায় দেখানো হচ্ছে" : "প্রতারক তালিকা থেকে সরানো হয়েছে"}
                      </span>
                      {donor.blockReason && <> · ব্লকের কারণ: {donor.blockReason}</>}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <ActionButton tone="gray" disabled={busy} onClick={() => setEditingId(editingId === donor.id ? null : donor.id)}>
                    <Pencil className="h-3.5 w-3.5" /> এডিট
                  </ActionButton>
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
                  {donor.status === "Blocked" &&
                    (donor.inFraudList ? (
                      <ActionButton
                        tone="outlineRed"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`${donor.fullName}-কে প্রতারক তালিকা থেকে সরাবেন? তিনি ব্লক অবস্থাতেই থাকবেন।`)) {
                            act(donor, () => setDonorFraudListing(token, donor.id, false));
                          }
                        }}
                      >
                        <EyeOff className="h-3.5 w-3.5" /> প্রতারক তালিকা থেকে সরান
                      </ActionButton>
                    ) : (
                      <ActionButton
                        tone="gray"
                        disabled={busy}
                        onClick={() => act(donor, () => setDonorFraudListing(token, donor.id, true))}
                      >
                        <Eye className="h-3.5 w-3.5" /> প্রতারক তালিকায় দেখান
                      </ActionButton>
                    ))}
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
              {editingId === donor.id && (
                <EditDonorForm donor={donor} token={token} onSaved={(run) => runAction(run)} onCancel={() => setEditingId(null)} />
              )}
            </li>
          );
        })}
      </ul>

      <Pagination page={page} pages={data?.pages ?? 1} onPage={setPage} />
    </section>
  );
}
