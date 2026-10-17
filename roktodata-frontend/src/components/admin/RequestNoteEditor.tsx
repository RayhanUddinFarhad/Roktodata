"use client";

import { Check, X } from "lucide-react";
import { ActionButton } from "@/components/admin/ui";
import { toBanglaNumber } from "@/lib/data";

export const DEFAULT_FULFILLED_NOTE = "রক্ত ম্যানেজ হয়েছে। সহযোগিতার জন্য সবাইকে ধন্যবাদ।";
export const NOTE_MAX = 300;

// "fulfill" also marks the request as fulfilled; "note" only edits the public note.
export type NoteMode = "fulfill" | "note";

export function RequestNoteEditor({
  mode,
  draft,
  onDraft,
  busy,
  onCancel,
  onSave,
}: {
  mode: NoteMode;
  draft: string;
  onDraft: (draft: string) => void;
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-700">
          {mode === "fulfill"
            ? "রক্ত ম্যানেজ হয়েছে — পোস্টে যে আপডেট দেখাবে তা লিখুন"
            : "পোস্টে দেখানোর জন্য নোট লিখুন (ফাঁকা রাখলে নোট মুছে যাবে)"}
        </span>
        <textarea
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          maxLength={NOTE_MAX}
          rows={2}
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400">
          {toBanglaNumber(draft.length)}/{toBanglaNumber(NOTE_MAX)}
        </span>
        <div className="flex flex-wrap gap-2">
          <ActionButton tone="gray" disabled={busy} onClick={onCancel}>
            <X className="h-3.5 w-3.5" /> বাদ দিন
          </ActionButton>
          <ActionButton tone="green" disabled={busy} onClick={onSave}>
            <Check className="h-3.5 w-3.5" />
            {mode === "fulfill" ? "ম্যানেজ হয়েছে হিসেবে চিহ্নিত করুন" : "সংরক্ষণ করুন"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
