import { Sparkles } from "lucide-react";
import type { AdminStats } from "@/lib/api";
import { toBanglaNumber } from "@/lib/data";

const TOOL_LABELS: Record<string, string> = {
  search_donors: "ডোনার খোঁজা",
  list_blood_requests: "অনুরোধ দেখা",
  next_donation_date: "পরের রক্তদানের তারিখ",
  blood_compatibility: "গ্রুপ মেলানো",
  read_article: "লেখা পড়া",
};

const n = (value: number) => toBanglaNumber(value.toLocaleString("en-US"));

// The AI assistant's last 7 days: how much it was asked, what it did, and how often it struggled.
export default function AssistantStats({ assistant }: { assistant?: AdminStats["assistant"] }) {
  if (!assistant) return null;
  const tools = Object.entries(assistant.tools).sort((a, b) => b[1] - a[1]);
  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <Sparkles className="h-4 w-4 text-red-600" />
          এআই সহকারী
          {!assistant.enabled && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">বন্ধ (GEMINI_API_KEY নেই)</span>}
        </h2>
        <p className="text-xs text-slate-500">গত ৭ দিন · কে কী লিখেছেন তা রাখা হয় না, শুধু সংখ্যা</p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        {[
          ["আজ প্রশ্ন", assistant.today],
          ["৭ দিনে প্রশ্ন", assistant.week],
          ["বিকল্প মডেলে উত্তর", assistant.fallbacks],
          ["উত্তর দিতে পারেনি", assistant.failures + assistant.capped],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{n(value as number)}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {tools.length === 0 ? (
          <span className="text-slate-400">এখনো কোনো টুল ব্যবহার হয়নি।</span>
        ) : (
          tools.map(([name, count]) => (
            <span key={name} className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">
              {TOOL_LABELS[name] ?? name}: {n(count)}
            </span>
          ))
        )}
        <span className="ml-auto text-slate-400">
          টোকেন: ইনপুট {n(assistant.inputTokens)} · আউটপুট {n(assistant.outputTokens)}
        </span>
      </div>
    </section>
  );
}
