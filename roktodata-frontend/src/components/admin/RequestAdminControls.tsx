"use client";

import { useState } from "react";
import { CircleCheck, PencilLine, ShieldCheck, Trash2 } from "lucide-react";
import { DEFAULT_FULFILLED_NOTE, RequestNoteEditor, type NoteMode } from "@/components/admin/RequestNoteEditor";
import { ActionButton } from "@/components/admin/ui";
import { ApiError, deleteRequest, setRequestNote, setRequestStatus } from "@/lib/api";
import { writeAdminToken } from "@/lib/adminToken";
import type { BloodRequest } from "@/lib/data";

// Admin actions on a post in the public feed, shown only while an admin is logged in.
// onChange receives the updated request, or null once it has been deleted.
export default function RequestAdminControls({
  request,
  token,
  onChange,
}: {
  request: BloodRequest;
  token: string;
  onChange: (request: BloodRequest | null) => void;
}) {
  const [editor, setEditor] = useState<{ mode: NoteMode; draft: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<{ message: string }>, next: BloodRequest | null) {
    setBusy(true);
    setError("");
    try {
      await action();
      setEditor(null);
      onChange(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        writeAdminToken(null);
        return;
      }
      setError(err instanceof ApiError ? err.message : "কিছু একটা সমস্যা হয়েছে।");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!editor) return;
    const note = editor.draft.trim();
    if (editor.mode === "fulfill") {
      run(() => setRequestStatus(token, request.id, "Fulfilled", note), {
        ...request,
        status: "Fulfilled",
        adminNote: note,
      });
    } else {
      run(() => setRequestNote(token, request.id, note), { ...request, adminNote: note });
    }
  }

  function remove() {
    if (!window.confirm(`${request.patientName}-এর অনুরোধটি স্থায়ীভাবে ডিলিট করবেন?`)) return;
    run(() => deleteRequest(token, request.id), null);
  }

  const openEditor = (mode: NoteMode) =>
    setEditor({ mode, draft: request.adminNote || (mode === "fulfill" ? DEFAULT_FULFILLED_NOTE : "") });

  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" /> অ্যাডমিন
        </span>
        {request.status === "Approved" && (
          <ActionButton tone="green" disabled={busy} onClick={() => openEditor("fulfill")}>
            <CircleCheck className="h-3.5 w-3.5" /> রক্ত ম্যানেজ হয়েছে
          </ActionButton>
        )}
        <ActionButton tone="gray" disabled={busy} onClick={() => openEditor("note")}>
          <PencilLine className="h-3.5 w-3.5" /> {request.adminNote ? "নোট এডিট" : "নোট লিখুন"}
        </ActionButton>
        <ActionButton tone="outlineRed" disabled={busy} onClick={remove}>
          <Trash2 className="h-3.5 w-3.5" /> ডিলিট
        </ActionButton>
      </div>
      {editor && (
        <RequestNoteEditor
          mode={editor.mode}
          draft={editor.draft}
          onDraft={(draft) => setEditor({ ...editor, draft })}
          busy={busy}
          onCancel={() => setEditor(null)}
          onSave={save}
        />
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
