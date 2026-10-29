"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ChevronRight, HandCoins, HeartHandshake, PhoneCall, ShieldAlert, TriangleAlert, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { acceptPledge, closePledge, pendingContact, showPledge, subscribePledge } from "@/lib/contactPledge";

const RULES = [
  {
    icon: HandCoins,
    tone: "bg-red-50 text-red-600",
    title: "অগ্রিম কোনো টাকা নয়",
    text: "কোনো ডোনারকে আগে টাকা দেবেন না। কেউ টাকা চাইলে তাঁর কার্ডের \"অভিযোগ\" বাটনে আমাদের জানান।",
  },
  {
    icon: HeartHandshake,
    tone: "bg-emerald-50 text-emerald-700",
    title: "ডোনারের যত্ন নিন",
    text: "ডোনার বিনামূল্যে রক্ত দেন। রক্ত দেওয়ার পর যাতায়াত ভাড়াটা দিন, সাথে কিছু ফল বা অন্তত একটা ডাব। বাসায় পৌঁছানো পর্যন্ত খোঁজ রাখুন।",
  },
  {
    icon: ShieldAlert,
    tone: "bg-amber-50 text-amber-700",
    title: "ভালো ব্যবহার করুন",
    text: "ডোনারের সাথে খারাপ ব্যবহারের অভিযোগ পেলে ভবিষ্যতে রক্তদাতা থেকে সাহায্য পাওয়া কঠিন হবে।",
  },
];

const noPending = () => null;

// A slim reminder above a donor list, plus the rules sheet that opens on the first call / WhatsApp
// tap (see lib/contactPledge). Put it once on every page that lists donors; `banner={false}` keeps
// only the sheet (e.g. inside the assistant chat).
export default function ContactPledge({ className = "", banner = true }: { className?: string; banner?: boolean }) {
  const contact = useSyncExternalStore(subscribePledge, pendingContact, noPending);

  return (
    <>
      {banner && (
      <div
        className={`flex items-center gap-2.5 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2.5 text-xs leading-snug text-amber-900 ${className}`}
      >
        <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="flex-1">
          <span className="font-bold">ডোনারকে অগ্রিম টাকা দেবেন না।</span> কেউ টাকা চাইলে বা খারাপ ব্যবহার করলে কার্ডের &quot;অভিযোগ&quot; বাটনে জানান।
        </p>
        <button
          type="button"
          onClick={showPledge}
          className="flex shrink-0 items-center gap-0.5 font-semibold text-amber-800 underline decoration-amber-300 underline-offset-2 hover:decoration-amber-800"
        >
          নিয়মগুলো
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      )}
      {contact && <PledgeSheet kind={contact.kind} />}
    </>
  );
}

function PledgeSheet({ kind }: { kind: "call" | "whatsapp" | null }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePledge();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4" onClick={closePledge} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pledge-title"
        onClick={(e) => e.stopPropagation()}
        className="cp-up max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="relative bg-gradient-to-br from-red-600 to-rose-700 px-5 pb-5 pt-6 text-white">
          <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-white/40 sm:hidden" />
          <button type="button" onClick={closePledge} aria-label="বন্ধ করুন" className="absolute right-4 top-4 text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <h2 id="pledge-title" className="text-lg font-bold">
            {kind ? "ডোনারকে যোগাযোগের আগে ৩টি কথা" : "ডোনারের সাথে যোগাযোগের নিয়ম"}
          </h2>
          <p className="mt-1 text-xs text-white/80">তাঁরা সম্পূর্ণ বিনামূল্যে আপনার পাশে দাঁড়ান। তাঁদের সম্মান জানানো আমাদের সবার দায়িত্ব।</p>
        </div>

        <ul className="space-y-3 px-5 py-5">
          {RULES.map(({ icon: Icon, tone, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-slate-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <button
            type="button"
            onClick={acceptPledge}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-700"
          >
            {kind === "call" && <PhoneCall className="h-4 w-4" />}
            {kind === "whatsapp" && <WhatsAppIcon className="h-4 w-4" />}
            {kind === "call" ? "রাজি আছি, কল করুন" : kind === "whatsapp" ? "রাজি আছি, WhatsApp খুলুন" : "রাজি আছি"}
          </button>
          <button type="button" onClick={closePledge} className="w-full rounded-xl py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">
            বাতিল
          </button>
        </div>
      </div>
    </div>
  );
}
