"use client";

import { useState, type FormEvent } from "react";
import { BellRing, Loader2, Send, Smartphone, UserCheck } from "lucide-react";
import type { AdminContext } from "@/components/admin/AdminDashboard";
import { sendAdminPush, type AdminStats } from "@/lib/api";
import { DISTRICTS, toBanglaNumber } from "@/lib/data";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none";
const label = "mb-1 block text-xs font-semibold text-slate-600";

// Sends a notification to everyone with notifications on, or to one district and its surroundings,
// e.g. a blood donation camp or a dengue warning. Blood requests are announced automatically.
export default function PushPanel({ ctx, push }: { ctx: AdminContext; push?: AdminStats["push"] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [district, setDistrict] = useState("");
  const [sending, setSending] = useState(false);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const where = district ? `${district} ও আশেপাশের` : "সবার";
    if (!window.confirm(`${where} কাছে নোটিফিকেশনটি পাঠাবেন?\n\n${title}\n${body}`)) return;
    setSending(true);
    const ok = await ctx.runAction(() => sendAdminPush(ctx.token, { title, body, url: url || undefined, district: district || undefined }));
    setSending(false);
    if (ok) {
      setTitle("");
      setBody("");
      setUrl("");
    }
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <Smartphone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900">{push ? toBanglaNumber(push.devices) : "–"}</p>
            <p className="text-xs text-slate-500">নোটিফিকেশন চালু থাকা ডিভাইস</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900">{push ? toBanglaNumber(push.donors) : "–"}</p>
            <p className="text-xs text-slate-500">এর মধ্যে নিবন্ধিত ডোনারের ডিভাইস (রিমাইন্ডার পাবেন)</p>
          </div>
        </div>
      </div>

      {push && !push.enabled && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">সার্ভারে নোটিফিকেশনের চাবি বসানো নেই, তাই কিছু পাঠানো যাবে না।</p>
      )}

      <form onSubmit={send} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <BellRing className="h-4 w-4 text-red-600" />
          নোটিফিকেশন পাঠান
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          রক্তের অনুরোধের নোটিফিকেশন নিজে থেকেই যায়। এখান থেকে পাঠান ক্যাম্প, ডেঙ্গু সতর্কতা বা জরুরি ঘোষণা। কম পাঠাবেন, বেশি পাঠালে মানুষ নোটিফিকেশন বন্ধ করে দেয়।
        </p>
        <div className="mt-4 grid gap-3">
          <label>
            <span className={label}>শিরোনাম ({toBanglaNumber(title.length)}/৬০)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} required placeholder="যেমন: শুক্রবার ঢাকা মেডিকেলে রক্তদান ক্যাম্প" className={`${field} h-10`} />
          </label>
          <label>
            <span className={label}>বার্তা ({toBanglaNumber(body.length)}/২০০)</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={200} required rows={3} className={`${field} py-2`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={label}>কাদের কাছে</span>
              <select value={district} onChange={(e) => setDistrict(e.target.value)} className={`${field} h-10`}>
                <option value="">সবার কাছে</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d} ও আশেপাশে (প্রায় ৫০ কিমি)
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={label}>চাপ দিলে যে পাতা খুলবে (ঐচ্ছিক)</span>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/learn" className={`${field} h-10`} />
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={sending || push?.enabled === false}
          className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          পাঠান
        </button>
      </form>
    </section>
  );
}
