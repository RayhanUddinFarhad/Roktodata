"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Save, X } from "lucide-react";
import ThanaSelect from "@/components/ThanaSelect";
import { updateAdminDonor, type AdminDonor } from "@/lib/api";
import { BLOOD_GROUPS, DISTRICTS, type BloodGroup } from "@/lib/data";

const field = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none";
const label = "mb-1 block text-[11px] font-semibold text-slate-600";
const DAY = 864e5;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

// Edits every detail of a donor from the admin panel, including whether they can donate now and,
// if not, the day they can again (they come back to search that day by themselves).
export default function EditDonorForm({
  donor,
  token,
  onSaved,
  onCancel,
}: {
  donor: AdminDonor;
  token: string;
  onSaved: (run: () => Promise<{ message: string }>) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(donor.fullName);
  const [phoneNumber, setPhoneNumber] = useState(donor.phoneNumber);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(donor.bloodGroup);
  const [district, setDistrict] = useState(donor.district);
  const [upazila, setUpazila] = useState(donor.upazila ?? "");
  const [lastDonationDate, setLastDonationDate] = useState(donor.lastDonationDate ?? "");
  const [ready, setReady] = useState(donor.isReadyToDonate);
  const [readyAgainAt, setReadyAgainAt] = useState(donor.readyAgainAt ?? "");
  const [saving, setSaving] = useState(false);

  // Quick picks for the return date.
  const afterLast = (days: number) => (lastDonationDate ? ymd(new Date(new Date(`${lastDonationDate}T00:00:00Z`).getTime() + days * DAY)) : "");
  const fromToday = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return ymd(d);
  };
  const picks: [string, string][] = [
    ...(lastDonationDate ? ([["শেষ রক্তদানের ৯০ দিন পর", afterLast(90)], ["১২০ দিন পর", afterLast(120)]] as [string, string][]) : []),
    ["১ মাস পর", fromToday(1)],
    ["৩ মাস পর", fromToday(3)],
    ["৬ মাস পর", fromToday(6)],
    ["জানা নেই", ""],
  ];

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onSaved(() =>
      updateAdminDonor(token, donor.id, {
        fullName: fullName.trim(),
        phoneNumber,
        bloodGroup,
        district,
        upazila: upazila || undefined,
        lastDonationDate: lastDonationDate || undefined,
        isReadyToDonate: ready,
        readyAgainAt: ready ? undefined : readyAgainAt || undefined,
      }),
    );
    setSaving(false);
    if (ok) onCancel();
  }

  return (
    <form onSubmit={save} className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label>
          <span className={label}>পূর্ণ নাম</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} className={field} />
        </label>
        <label>
          <span className={label}>মোবাইল নাম্বার</span>
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))} required inputMode="numeric" maxLength={11} pattern="01[3-9][0-9]{8}" className={field} />
        </label>
        <label>
          <span className={label}>রক্তের গ্রুপ</span>
          <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)} className={field}>
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label>
          <span className={label}>জেলা</span>
          <select value={district} onChange={(e) => { setDistrict(e.target.value); setUpazila(""); }} className={field}>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label>
          <span className={label}>থানা / উপজেলা</span>
          <ThanaSelect district={district} value={upazila} onChange={setUpazila} emptyLabel="জানা নেই" className={field} />
        </label>
        <label>
          <span className={label}>শেষ রক্তদান (খালি = জানা নেই)</span>
          <input type="date" value={lastDonationDate} max={ymd(new Date())} onChange={(e) => setLastDonationDate(e.target.value)} className={field} />
        </label>
      </div>

      <div className="mt-4">
        <span className={label}>রক্তদানের অবস্থা</span>
        <div className="flex gap-2">
          {[[true, "রক্ত দিতে প্রস্তুত"], [false, "এখন প্রস্তুত নন"]].map(([value, text]) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setReady(value as boolean)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                ready === value ? (value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-amber-500 bg-amber-50 text-amber-700") : "border-slate-300 bg-white text-slate-600"
              }`}
            >
              {text as string}
            </button>
          ))}
        </div>
      </div>

      {!ready && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <label>
            <span className={label}>কবে থেকে আবার রক্ত দিতে পারবেন (সেদিন থেকে নিজে থেকেই সার্চে দেখাবে; খালি = যতদিন না বদলান)</span>
            <input type="date" value={readyAgainAt} onChange={(e) => setReadyAgainAt(e.target.value)} className={`${field} sm:max-w-xs`} />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {picks.map(([text, value]) => (
              <button key={text} type="button" onClick={() => setReadyAgainAt(value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${readyAgainAt === value ? "border-amber-500 bg-amber-500 text-white" : "border-amber-300 bg-white text-amber-800"}`}>
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white">
          <X className="h-3.5 w-3.5" /> বাতিল
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-1 rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} সংরক্ষণ করুন
        </button>
      </div>
    </form>
  );
}
