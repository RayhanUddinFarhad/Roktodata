"use client";

import { useEffect, useState } from "react";
import { Check, MapPin, Pencil, Phone, RotateCw, Trash2, X } from "lucide-react";
import type { AdminContext } from "@/components/admin/AdminDashboard";
import { ActionButton, ListState, Pagination, formatDate } from "@/components/admin/ui";
import ThanaSelect from "@/components/ThanaSelect";
import { deleteFeedback, getAdminFeedback, setFeedbackStatus, updateAdminFeedback, type AdminFeedback } from "@/lib/api";
import { DISTRICTS, formatLocation, type FeedbackStatus } from "@/lib/data";

const STATUS: Record<FeedbackStatus, { label: string; tone: string }> = {
  Pending: { label: "অপেক্ষমাণ", tone: "bg-amber-100 text-amber-800" },
  Approved: { label: "সাইটে দেখানো হচ্ছে", tone: "bg-emerald-100 text-emerald-700" },
  Rejected: { label: "বাতিল", tone: "bg-slate-200 text-slate-600" },
};

const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none";

// Visitors' feedback: approving one shows it on the home page and /feedback (name and area only).
export default function FeedbackPanel({ ctx }: { ctx: AdminContext }) {
  const { token, refreshKey, runAction, onError } = ctx;
  const [status, setStatus] = useState<FeedbackStatus | "">("Pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ feedback: AdminFeedback[]; total: number; pages: number } | null>(null);
  // Loading until the response for the current filter/page/refresh has arrived.
  const requestKey = `${refreshKey}|${status}|${page}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminFeedback(token, { status: status || undefined, page })
      .then((result) => {
        if (cancelled) return;
        // Acting on the last item of a page can leave it empty; step back a page.
        if (result.feedback.length === 0 && page > 1) return setPage(page - 1);
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

  async function act(item: AdminFeedback, action: () => Promise<{ message: string }>) {
    setBusyId(item.id);
    const ok = await runAction(action);
    setBusyId(null);
    return ok;
  }
  const changeStatus = (item: AdminFeedback, next: FeedbackStatus) => act(item, () => setFeedbackStatus(token, item.id, next));

  const items = data?.feedback ?? [];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">অনুমোদন দিলে হোম পেজ ও ফিডব্যাক পাতায় দেখানো হবে (নাম আর এলাকা, নাম্বার নয়)। মোট {data?.total ?? "…"}টি</p>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as FeedbackStatus | "");
            setPage(1);
          }}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none sm:w-48"
        >
          <option value="">সকল ফিডব্যাক</option>
          {Object.entries(STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <ListState loading={loading} empty={items.length === 0} emptyText="কোনো ফিডব্যাক নেই।" />

      <ul className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
        {items.map((item) => {
          const busy = busyId === item.id;
          return (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">{item.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{item.roleLabel}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS[item.status].tone}`}>{STATUS[item.status].label}</span>
                </p>
                <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {formatLocation(item.district, item.upazila)}
                </span>
                {item.phoneNumber && (
                  <a href={`tel:${item.phoneNumber}`} className="flex items-center gap-1 font-mono hover:text-slate-800" title="সাইটে দেখানো হয় না">
                    <Phone className="h-3 w-3" />
                    {item.phoneNumber}
                  </a>
                )}
              </div>

              {editingId === item.id ? (
                <EditFeedback
                  item={item}
                  busy={busy}
                  onCancel={() => setEditingId(null)}
                  onSave={async (changes) => {
                    if (await act(item, () => updateAdminFeedback(token, item.id, changes))) setEditingId(null);
                  }}
                />
              ) : (
                <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{item.message}</p>
              )}

              {editingId !== item.id && (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {item.status !== "Approved" && (
                    <ActionButton tone="green" disabled={busy} onClick={() => changeStatus(item, "Approved")}>
                      <Check className="h-3.5 w-3.5" /> অনুমোদন দিন
                    </ActionButton>
                  )}
                  {item.status === "Pending" && (
                    <ActionButton tone="outlineRed" disabled={busy} onClick={() => changeStatus(item, "Rejected")}>
                      <X className="h-3.5 w-3.5" /> বাতিল
                    </ActionButton>
                  )}
                  {item.status === "Approved" && (
                    <ActionButton tone="gray" disabled={busy} onClick={() => changeStatus(item, "Rejected")}>
                      <X className="h-3.5 w-3.5" /> সাইট থেকে সরান
                    </ActionButton>
                  )}
                  {item.status === "Rejected" && (
                    <ActionButton tone="gray" disabled={busy} onClick={() => changeStatus(item, "Pending")}>
                      <RotateCw className="h-3.5 w-3.5" /> আবার রিভিউ
                    </ActionButton>
                  )}
                  <ActionButton tone="gray" disabled={busy} onClick={() => setEditingId(item.id)}>
                    <Pencil className="h-3.5 w-3.5" /> এডিট
                  </ActionButton>
                  <ActionButton
                    tone="gray"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("ফিডব্যাকটি স্থায়ীভাবে মুছে ফেলবেন?")) act(item, () => deleteFeedback(token, item.id));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> মুছুন
                  </ActionButton>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Pagination page={page} pages={data?.pages ?? 1} onPage={setPage} />
    </section>
  );
}

// Fix spelling or the area before approving.
function EditFeedback({
  item,
  busy,
  onCancel,
  onSave,
}: {
  item: AdminFeedback;
  busy: boolean;
  onCancel: () => void;
  onSave: (changes: { name: string; district: string; upazila: string; message: string }) => void;
}) {
  const [name, setName] = useState(item.name);
  const [district, setDistrict] = useState(item.district);
  const [upazila, setUpazila] = useState(item.upazila);
  const [message, setMessage] = useState(item.message);

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={`${fieldClass} h-9`} aria-label="নাম" />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setUpazila("");
          }}
          className={`${fieldClass} h-9`}
          aria-label="জেলা"
        >
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <ThanaSelect district={district} value={upazila} onChange={setUpazila} emptyLabel="থানা নেই" className={`${fieldClass} h-9`} />
      </div>
      <textarea value={message} rows={4} maxLength={500} onChange={(e) => setMessage(e.target.value)} className={`${fieldClass} py-2`} aria-label="ফিডব্যাক" />
      <div className="flex justify-end gap-2">
        <ActionButton tone="gray" disabled={busy} onClick={onCancel}>
          বাতিল
        </ActionButton>
        <ActionButton tone="green" disabled={busy} onClick={() => onSave({ name: name.trim(), district, upazila, message: message.trim() })}>
          <Check className="h-3.5 w-3.5" /> সেভ করুন
        </ActionButton>
      </div>
    </div>
  );
}
