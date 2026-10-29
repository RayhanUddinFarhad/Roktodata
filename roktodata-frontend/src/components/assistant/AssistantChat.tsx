"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, CalendarDays, ChevronRight, Hospital, Loader2, MapPin, PhoneCall, RotateCcw, Sparkles } from "lucide-react";
import ContactPledge from "@/components/ContactPledge";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ApiError, trackDonorContact, warmUpApi } from "@/lib/api";
import { askAssistant, type AssistantCard, type AssistantMessage } from "@/lib/assistant";
import { guardContact } from "@/lib/contactPledge";
import { donorWhatsAppMessage, formatLocation, NOT_MENTIONED, toBanglaNumber } from "@/lib/data";

const STORAGE_KEY = "rd-assistant-chat";
const SUGGESTIONS = [
  "ঢাকায় O+ রক্ত লাগবে",
  "শেষ রক্তদানের কতদিন পর আবার দেওয়া যায়?",
  "ডায়াবেটিস থাকলে কি রক্ত দেওয়া যায়?",
  "ডেঙ্গুতে প্লাটিলেট কত হলে রক্ত লাগে?",
  "A+ রোগী কোন কোন গ্রুপের রক্ত নিতে পারে?",
];

function loadChat(): AssistantMessage[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// The chat itself, used in the floating sheet and on /assistant. The conversation is kept for this tab
// (sessionStorage), so it survives moving between pages.
export default function AssistantChat({ autoFocus = false }: { autoFocus?: boolean }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    // Storage is only readable in the browser, so the saved chat is restored after mounting.
    setMessages(loadChat());
    // The free server sleeps when idle: wake it while the visitor types.
    warmUpApi();
    return () => abort.current?.abort();
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const history: AssistantMessage[] = [...messages, { role: "user", text }];
    setMessages([...history, { role: "assistant", text: "" }]);
    setInput("");
    setBusy(true);
    const update = (change: (last: AssistantMessage) => AssistantMessage) =>
      setMessages((current) => [...current.slice(0, -1), change(current[current.length - 1])]);

    abort.current = new AbortController();
    try {
      await askAssistant(
        history,
        (event) => {
          if (event.type === "text") update((last) => ({ ...last, text: last.text + event.text }));
          if (event.type === "card") update((last) => ({ ...last, cards: [...(last.cards ?? []), event.card] }));
          if (event.type === "error") update((last) => ({ ...last, error: event.message }));
        },
        abort.current.signal,
      );
    } catch (err) {
      if (abort.current.signal.aborted) return;
      update((last) => ({ ...last, error: err instanceof ApiError ? err.message : "সহকারী উত্তর দিতে পারেনি। আবার চেষ্টা করুন।" }));
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ask(input);
  }

  function restart() {
    abort.current?.abort();
    setBusy(false);
    setMessages([]);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <Welcome onPick={ask} />
        ) : (
          messages.map((message, i) =>
            message.role === "user" ? (
              <p key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-red-600 px-3.5 py-2 text-sm text-white">
                {message.text}
              </p>
            ) : (
              <div key={i} className="max-w-[95%] space-y-2">
                {message.cards?.map((card, j) => <CardView key={j} card={card} />)}
                {message.text ? (
                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 text-sm leading-relaxed text-slate-800">
                    <RichText text={message.text} />
                  </div>
                ) : (
                  !message.error && busy && i === messages.length - 1 && <Thinking />
                )}
                {message.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{message.error}</p>}
              </div>
            ),
          )
        )}
      </div>

      <div className="border-t border-slate-100 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
        <form onSubmit={submit} className="flex items-end gap-2">
          {messages.length > 0 && (
            <button type="button" onClick={restart} title="নতুন করে শুরু" aria-label="নতুন করে শুরু" className="mb-1 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            rows={1}
            maxLength={1500}
            autoFocus={autoFocus}
            placeholder="প্রশ্ন লিখুন… (বাংলা বা Banglish)"
            className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="পাঠান"
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] leading-snug text-slate-400">
          এআই ভুল করতে পারে, এটি চিকিৎসকের পরামর্শের বিকল্প নয়। নাম, নাম্বার বা ব্যক্তিগত তথ্য লিখবেন না।
        </p>
      </div>
      <ContactPledge banner={false} />
    </div>
  );
}

function Welcome({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="pt-2 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-lg shadow-red-600/25">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="mt-3 font-bold text-slate-900">আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?</p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">ডোনার খোঁজা, রক্তদানের নিয়ম, ডেঙ্গু ও প্লাটিলেট নিয়ে প্রশ্ন করুন। উত্তর আসে রক্তদাতার নিজের লেখা থেকে।</p>
      <div className="mt-4 flex flex-col items-stretch gap-2 text-left">
        {SUGGESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onPick(question)}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 hover:border-red-300 hover:bg-red-50"
          >
            {question}
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <p className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ভাবছি… (প্রথম প্রশ্নে একটু সময় লাগতে পারে)
    </p>
  );
}

// The model's answer: paragraphs, "- " lists, **bold** and links to this site's own pages only.
function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => /^\s*([-*•]|\d+[.)])\s+/.test(line));
        return isList ? (
          <ul key={i} className={`list-disc space-y-0.5 pl-5 ${i ? "mt-2" : ""}`}>
            {lines.map((line, j) => (
              <li key={j}>{inline(line.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className={i ? "mt-2" : ""}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((piece, i) => {
    const bold = piece.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i} className="font-semibold text-slate-900">{bold[1]}</strong>;
    const link = piece.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      // Only paths on this site become links; anything else stays plain text.
      return link[2].startsWith("/") && !link[2].startsWith("//") ? (
        <Link key={i} href={link[2]} className="font-semibold text-red-700 underline decoration-red-300 underline-offset-2 hover:decoration-red-700">
          {link[1]}
        </Link>
      ) : (
        link[1]
      );
    }
    return piece;
  });
}

function CardView({ card }: { card: AssistantCard }) {
  if (card.type === "requests") {
    return card.requests.length === 0 ? null : (
      <div className="space-y-2">
        {card.requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-[11px] text-white">{r.bloodGroup}</span>
              {toBanglaNumber(r.bags)} ব্যাগ রক্ত প্রয়োজন
            </p>
            {r.hospital && (
              <p className="mt-1.5 flex items-start gap-1 text-slate-600">
                <Hospital className="mt-0.5 h-3 w-3 shrink-0" />
                {r.hospital}
              </p>
            )}
            <p className="mt-1 flex items-center gap-1 text-slate-500">
              <MapPin className="h-3 w-3" />
              {formatLocation(r.district, r.upazila)}
              {r.neededDate && ` · প্রয়োজন: ${toBanglaNumber(r.neededDate)}`}
            </p>
            <a href={`tel:${r.phone}`} className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1 font-semibold text-white hover:bg-emerald-800">
              <PhoneCall className="h-3 w-3" />
              যোগাযোগ করুন
            </a>
          </div>
        ))}
        <Link href="/blood-requests" className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline">
          সব অনুরোধ দেখুন <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const more = `/find-donor?${new URLSearchParams({ bloodGroup: card.bloodGroup, district: card.district, ...(card.upazila && { upazila: card.upazila }) })}`;
  return card.donors.length === 0 ? null : (
    <div className="space-y-2">
      {card.donors.map((donor) => (
        <div key={donor.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="flex items-center gap-2">
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-700">{donor.bloodGroup}</span>
            <span className="truncate text-sm font-bold text-slate-900">{donor.fullName}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {formatLocation(donor.district, donor.upazila)}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              শেষ রক্তদান: {donor.lastDonationDate ?? NOT_MENTIONED}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a
              href={`tel:${donor.phoneNumber}`}
              onClick={(e) => guardContact(e, "call", () => trackDonorContact(donor.id, "call"))}
              className="flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              <PhoneCall className="h-3 w-3" />
              কল করুন
            </a>
            <WhatsAppButton
              phone={donor.phoneNumber}
              message={donorWhatsAppMessage(donor.bloodGroup)}
              onClick={(e) => guardContact(e, "whatsapp", () => trackDonorContact(donor.id, "whatsapp"))}
            />
            <span className="ml-auto font-mono text-[11px] text-slate-500">{donor.phoneNumber}</span>
          </div>
        </div>
      ))}
      {card.total > card.donors.length && (
        <Link href={more} className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline">
          আরও {toBanglaNumber(card.total - card.donors.length)} জন ডোনার দেখুন <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
