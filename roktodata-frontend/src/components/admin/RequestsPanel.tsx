"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Check,
  CircleCheck,
  Hospital,
  MapPin,
  MessageSquareText,
  PencilLine,
  Phone,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import type { AdminContext } from "@/components/admin/AdminDashboard";
import {
  ActionButton,
  ListState,
  Pagination,
  REQUEST_STATUS_LABELS,
  RequestStatusBadge,
  formatDate,
} from "@/components/admin/ui";
import { DEFAULT_FULFILLED_NOTE, RequestNoteEditor, type NoteMode } from "@/components/admin/RequestNoteEditor";
import { deleteRequest, getAdminRequests, setRequestNote, setRequestStatus } from "@/lib/api";
import { toBanglaNumber, type BloodRequest, type RequestStatus } from "@/lib/data";

// Patient blood requests: approving one posts it on the public "রক্তের অনুরোধ" page.
export default function RequestsPanel({ ctx }: { ctx: AdminContext }) {
  const { token, refreshKey, runAction, onError } = ctx;
  const [status, setStatus] = useState<RequestStatus | "">("Pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ requests: BloodRequest[]; total: number; pages: number } | null>(null);
  // Loading until the response for the current filter/page/refresh has arrived.
  const requestKey = `${refreshKey}|${status}|${page}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminRequests(token, { status: status || undefined, page })
      .then((result) => {
        if (cancelled) return;
        // Acting on the last item of a page can leave it empty; step back a page.
        if (result.requests.length === 0 && page > 1) return setPage(page - 1);
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

  // The request whose public note is being written.
  const [editor, setEditor] = useState<{ id: string; mode: NoteMode; draft: string } | null>(null);

  async function act(request: BloodRequest, action: () => Promise<{ message: string }>) {
    setBusyId(request.id);
    const ok = await runAction(action);
    setBusyId(null);
    return ok;
  }

  const changeStatus = (request: BloodRequest, next: RequestStatus) =>
    act(request, () => setRequestStatus(token, request.id, next));

  const openEditor = (request: BloodRequest, mode: NoteMode) =>
    setEditor({ id: request.id, mode, draft: request.adminNote || (mode === "fulfill" ? DEFAULT_FULFILLED_NOTE : "") });

  async function saveNote(request: BloodRequest) {
    if (!editor) return;
    const note = editor.draft.trim();
    const ok = await act(request, () =>
      editor.mode === "fulfill"
        ? setRequestStatus(token, request.id, "Fulfilled", note)
        : setRequestNote(token, request.id, note),
    );
    // Keep the draft open on failure so it isn't lost.
    if (ok) setEditor(null);
  }

  const requests = data?.requests ?? [];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          <p>অনুমোদন দিলে অনুরোধটি &quot;রক্তের অনুরোধ&quot; পাতায় পোস্ট হবে। মোট {data?.total ?? "…"}টি</p>
          <p className="mt-0.5 text-xs">
            পোস্ট করা অনুরোধ দেখতে ফিল্টারে &quot;পোস্ট করা হয়েছে&quot; বাছুন, অথবা{" "}
            <Link href="/blood-requests" className="font-semibold text-red-600 hover:underline">
              রক্তের অনুরোধ পাতায়
            </Link>{" "}
            গিয়ে সরাসরি আপডেট বা ডিলিট করুন।
          </p>
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as RequestStatus | "");
            setPage(1);
          }}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none sm:w-48"
        >
          <option value="">সকল অনুরোধ</option>
          {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <ListState loading={loading} empty={requests.length === 0} emptyText="কোনো অনুরোধ নেই।" />

      <ul className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
        {requests.map((request) => {
          const busy = busyId === request.id;
          const editing = editor?.id === request.id;
          return (
            <li key={request.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                      {request.requiredBloodGroup}
                    </span>
                    <span className="font-bold text-slate-900">{request.patientName}</span>
                    <span className="text-sm text-slate-600">· {toBanglaNumber(request.bagsNeeded)} ব্যাগ</span>
                    <RequestStatusBadge status={request.status} />
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <a
                      href={`tel:${request.requesterPhone}`}
                      className="flex items-center gap-1 font-mono hover:text-slate-800"
                    >
                      <Phone className="h-3 w-3" />
                      {request.requesterPhone}
                    </a>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {request.upazila ? `${request.upazila}, ${request.district}` : request.district}
                    </span>
                    {request.hospitalAddress && (
                      <span className="flex items-center gap-1">
                        <Hospital className="h-3 w-3" />
                        {request.hospitalAddress}
                      </span>
                    )}
                    {request.neededDate && (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        প্রয়োজন: {request.neededDate}
                      </span>
                    )}
                    <span>অনুরোধ: {formatDate(request.createdAt)}</span>
                  </div>
                  {request.adminNote && !editing && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
                      <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="whitespace-pre-line">{request.adminNote}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {request.status === "Pending" && (
                    <>
                      <ActionButton tone="green" disabled={busy} onClick={() => changeStatus(request, "Approved")}>
                        <Check className="h-3.5 w-3.5" /> অনুমোদন দিন
                      </ActionButton>
                      <ActionButton tone="outlineRed" disabled={busy} onClick={() => changeStatus(request, "Rejected")}>
                        <X className="h-3.5 w-3.5" /> বাতিল
                      </ActionButton>
                    </>
                  )}
                  {request.status === "Approved" && (
                    <>
                      <ActionButton tone="green" disabled={busy} onClick={() => openEditor(request, "fulfill")}>
                        <CircleCheck className="h-3.5 w-3.5" /> রক্ত ম্যানেজ হয়েছে
                      </ActionButton>
                      <ActionButton tone="gray" disabled={busy} onClick={() => changeStatus(request, "Pending")}>
                        <RotateCw className="h-3.5 w-3.5" /> পোস্ট সরান
                      </ActionButton>
                    </>
                  )}
                  {(request.status === "Approved" || request.status === "Fulfilled") && (
                    <ActionButton tone="gray" disabled={busy} onClick={() => openEditor(request, "note")}>
                      <PencilLine className="h-3.5 w-3.5" /> {request.adminNote ? "নোট এডিট" : "নোট লিখুন"}
                    </ActionButton>
                  )}
                  {(request.status === "Rejected" || request.status === "Fulfilled") && (
                    <ActionButton tone="gray" disabled={busy} onClick={() => changeStatus(request, "Pending")}>
                      <RotateCw className="h-3.5 w-3.5" /> আবার রিভিউ
                    </ActionButton>
                  )}
                  <ActionButton
                    tone="outlineRed"
                    disabled={busy}
                    onClick={() => {
                      const posted = request.status === "Approved" || request.status === "Fulfilled";
                      const warning = posted ? " এটি \"রক্তের অনুরোধ\" পাতা থেকেও সরে যাবে।" : "";
                      if (window.confirm(`${request.patientName}-এর অনুরোধটি স্থায়ীভাবে মুছে ফেলবেন?${warning}`)) {
                        act(request, () => deleteRequest(token, request.id));
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> ডিলিট
                  </ActionButton>
                </div>
              </div>

              {editing && editor && (
                <RequestNoteEditor
                  mode={editor.mode}
                  draft={editor.draft}
                  onDraft={(draft) => setEditor({ ...editor, draft })}
                  busy={busy}
                  onCancel={() => setEditor(null)}
                  onSave={() => saveNote(request)}
                />
              )}
            </li>
          );
        })}
      </ul>

      <Pagination page={page} pages={data?.pages ?? 1} onPage={setPage} />
    </section>
  );
}
