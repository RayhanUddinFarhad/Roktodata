"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, ClipboardPaste, Loader2, Plus, Trash2, UserPlus, Wand2 } from "lucide-react";
import type { AdminContext } from "@/components/admin/AdminDashboard";
import ThanaSelect from "@/components/ThanaSelect";
import { ApiError, createAdminDonor } from "@/lib/api";
import { BLOOD_GROUPS, DISTRICTS, type BloodGroup } from "@/lib/data";
import { emptyDraft, parseDonors, type DonorDraft } from "@/lib/donorParse";

const field = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none";
const label = "mb-1 block text-[11px] font-semibold text-slate-600";
const PHONE = /^01[3-9]\d{8}$/;

type Row = DonorDraft & { key: number; state: "edit" | "saving" | "saved" | "error"; message: string };
let nextKey = 1;
const toRow = (d: DonorDraft): Row => ({ ...d, key: nextKey++, state: "edit", message: "" });

// What still has to be filled in before a row can be saved.
function problems(r: Row) {
  return [
    !r.fullName.trim() && "নাম",
    !PHONE.test(r.phoneNumber) && "সঠিক মোবাইল নাম্বার",
    !r.bloodGroup && "রক্তের গ্রুপ",
    !r.district && "জেলা",
  ].filter(Boolean) as string[];
}

// Adds donors by hand: paste their details (one or several, a blank line between donors) and the
// fields fill themselves; check them, then add one or all. Added donors are approved straight away.
export default function AddDonorPanel({ ctx }: { ctx: AdminContext }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const change = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: number) => setRows((rs) => rs.filter((r) => r.key !== key));

  function read() {
    const drafts = parseDonors(text);
    if (!drafts.length) return;
    setRows((rs) => [...rs.filter((r) => r.state !== "saved"), ...drafts.map(toRow)]);
    setText("");
  }

  async function save(row: Row) {
    if (problems(row).length || row.state === "saving" || row.state === "saved") return false;
    change(row.key, { state: "saving", message: "" });
    try {
      const { message } = await createAdminDonor(ctx.token, {
        fullName: row.fullName.trim(),
        phoneNumber: row.phoneNumber,
        bloodGroup: row.bloodGroup as BloodGroup,
        district: row.district,
        upazila: row.upazila || undefined,
        lastDonationDate: row.lastDonationDate || undefined,
        isReadyToDonate: row.isReadyToDonate,
      });
      change(row.key, { state: "saved", message });
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) ctx.onError(err);
      change(row.key, { state: "error", message: err instanceof Error ? err.message : "যোগ করা যায়নি।" });
      return false;
    }
  }

  async function saveAll() {
    let added = 0;
    for (const row of rows) if (await save(row)) added++;
    // one refresh of the stats and lists, with a summary
    if (added) await ctx.runAction(async () => ({ message: `${added} জন ডোনার যুক্ত হয়েছেন।` }));
  }

  const ready = rows.filter((r) => r.state !== "saved" && !problems(r).length);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-900" htmlFor="donor-paste">
          <ClipboardPaste className="h-4 w-4 text-red-600" />
          ডোনারের তথ্য পেস্ট করুন
        </label>
        <p className="mt-1 text-xs text-slate-500">
          মেসেজ বা পোস্ট থেকে কপি করা লেখা দিন। নাম, রক্তের গ্রুপ, মোবাইল নাম্বার, শেষ রক্তদানের তারিখ, জেলা ও থানা নিজে থেকেই বসে যাবে। কয়েকজনের তথ্য একসাথে দিতে প্রত্যেকের মাঝে একটা ফাঁকা লাইন রাখুন।
        </p>
        <textarea
          id="donor-paste"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={"যেমন:\nমো. করিম উদ্দিন\nO+\nশেষ রক্তদান: ৪ নভেম্বর ২০২৫\nলোকেশন: গুলশান, ঢাকা\n01712345678"}
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-red-500 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={read} disabled={!text.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            <Wand2 className="h-4 w-4" /> তথ্য বের করুন
          </button>
          <button type="button" onClick={() => setRows((rs) => [...rs, toRow(emptyDraft())])}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Plus className="h-4 w-4" /> খালি ফর্ম
          </button>
        </div>
      </div>

      {rows.map((r) => {
        const missing = problems(r);
        const done = r.state === "saved";
        return (
          <div key={r.key} className={`rounded-xl border p-4 shadow-sm ${done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <fieldset disabled={done || r.state === "saving"} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label>
                <span className={label}>পূর্ণ নাম</span>
                <input value={r.fullName} onChange={(e) => change(r.key, { fullName: e.target.value })} className={field} />
              </label>
              <label>
                <span className={label}>মোবাইল নাম্বার</span>
                <input value={r.phoneNumber} inputMode="numeric" maxLength={11} placeholder="01XXXXXXXXX"
                  onChange={(e) => change(r.key, { phoneNumber: e.target.value.replace(/\D/g, "") })} className={field} />
              </label>
              <label>
                <span className={label}>রক্তের গ্রুপ</span>
                <select value={r.bloodGroup} onChange={(e) => change(r.key, { bloodGroup: e.target.value as BloodGroup })} className={field}>
                  <option value="">বাছুন</option>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label>
                <span className={label}>জেলা</span>
                <select value={r.district} onChange={(e) => change(r.key, { district: e.target.value, upazila: "" })} className={field}>
                  <option value="">বাছুন</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label>
                <span className={label}>থানা / উপজেলা (ঐচ্ছিক)</span>
                <ThanaSelect district={r.district} value={r.upazila} onChange={(v) => change(r.key, { upazila: v })} emptyLabel="জানা নেই" className={field} />
              </label>
              <label>
                <span className={label}>শেষ রক্তদান (ঐচ্ছিক)</span>
                <input type="date" value={r.lastDonationDate} onChange={(e) => change(r.key, { lastDonationDate: e.target.value })} className={field} />
              </label>
              <label className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
                <input type="checkbox" checked={!r.isReadyToDonate} onChange={(e) => change(r.key, { isReadyToDonate: !e.target.checked })} className="h-4 w-4 accent-red-600" />
                <span className="text-xs font-semibold text-slate-700">এখন রক্ত দিতে প্রস্তুত নন (তালিকায় দেখাবে না)</span>
              </label>
            </fieldset>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className={`flex items-center gap-1.5 text-xs ${done ? "text-emerald-700" : r.state === "error" ? "text-red-600" : missing.length ? "text-amber-700" : "text-slate-500"}`}>
                {done ? <CircleCheck className="h-4 w-4" /> : r.state === "error" || missing.length ? <CircleAlert className="h-4 w-4" /> : null}
                {done || r.state === "error" ? r.message : missing.length ? `বাকি: ${missing.join(", ")}` : "সব ঠিক আছে, যোগ করতে পারেন।"}
              </p>
              {!done && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => remove(r.key)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                    <Trash2 className="h-3.5 w-3.5" /> বাদ দিন
                  </button>
                  <button type="button" onClick={async () => { if (await save(r)) await ctx.runAction(async () => ({ message: "ডোনার যুক্ত হয়েছেন।" })); }}
                    disabled={missing.length > 0 || r.state === "saving"}
                    className="flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                    {r.state === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} যোগ করুন
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {ready.length > 1 && (
        <button type="button" onClick={saveAll}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800">
          <UserPlus className="h-4 w-4" /> সব যোগ করুন ({ready.length} জন)
        </button>
      )}
    </section>
  );
}
