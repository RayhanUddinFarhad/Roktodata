"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { Check, Copy, Download, ImagePlus, Minus, Plus, Share2, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { ApiError, confirmCardSerial, reserveCardSerial } from "@/lib/api";
import { BLOOD_GROUPS, DISTRICTS, toBanglaNumber, type BloodGroup } from "@/lib/data";
import {
  CARD_W, captionFor, cardHeight, DESIGNS, drawCard, serialKey, tierOf,
  type CardState, type Fonts, type Photo, type Regions,
} from "@/lib/photocard";

const STORE_KEY = "roktodata-photocard";
const DEFAULT: CardState = { design: "idcard", palette: 0, name: "", group: "", count: 1, district: "", lastDate: "", phone: "", showPhone: false, size: "post" };
const MAX_COUNT = 200;
const noSubscribe = () => () => {};
const fileName = (s: CardState) => `roktodata-${s.count}-bar-roktodan.png`;

// Remembers the last card on this device (not the photo), so coming back continues where you left off.
function loadSaved(): CardState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function Confetti({ show }: { show: number }) {
  if (!show) return null;
  const pieces = Array.from({ length: 70 }, (_, i) => i);
  const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#facc15"];
  return (
    <div key={show} className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      <style>{`@keyframes pc-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1 } 100% { transform: translateY(110vh) rotate(720deg); opacity: .9 } }`}</style>
      {pieces.map((i) => (
        <span
          key={i}
          style={{
            position: "absolute", left: `${(i * 37) % 100}%`, top: 0, width: 10, height: 16, borderRadius: 2,
            background: colors[i % colors.length], animation: `pc-fall ${1.8 + (i % 7) * 0.25}s ${(i % 10) * 0.08}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default function PhotoCardMaker({ decoFont }: { decoFont: string }) {
  const [s, setS] = useState<CardState>(DEFAULT);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [fonts, setFonts] = useState<Fonts | null>(null);
  const [editing, setEditing] = useState<"name" | "group" | "date" | null>(null);
  const [done, setDone] = useState(0); // confetti key, set after a download/share
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regions = useRef<Regions | null>(null);
  const pulseAt = useRef(-10); // when (performance.now() seconds) the count last went up
  const fileInput = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean; onPhoto: boolean; dx: number; dy: number } | null>(null);
  const [scale, setScale] = useState(0.5); // CSS px per card px
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const picker = useRef<HTMLDivElement>(null);
  const [pickerSeen, setPickerSeen] = useState(false); // previews are drawn once the picker is in view

  const update = useCallback((patch: Partial<CardState>) => setS((prev) => ({ ...prev, ...patch })), []);

  // load the fonts, then restore the saved card
  const restored = useRef(false);
  useEffect(() => {
    const body = getComputedStyle(document.body).fontFamily;
    Promise.all([
      ...["400", "600", "700"].map((w) => document.fonts.load(`${w} 40px ${body}`, "রক্তদাতা ০১২৩")),
      document.fonts.load(`400 60px ${decoFont}`, "রক্তযোদ্ধা সম্মাননা"),
    ]).finally(() => {
      if (!restored.current) setS(loadSaved());
      restored.current = true;
      setFonts({ body, deco: decoFont });
    });
  }, [decoFont]);
  useEffect(() => {
    if (!restored.current) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
  }, [s]);

  // The card's serial number: reserved shortly after a name is typed, so it shows on the card right
  // away; a reservation saved from an earlier visit is renewed once. A number the card was saved with
  // stays with that name and group; editing them afterwards reserves a new one.
  const needsSerial = !!s.name.trim() && (!s.serial || (!!s.serialUsed && s.serialFor !== serialKey(s)));
  const renewed = useRef(false);
  useEffect(() => {
    if (!fonts) return;
    const renew = !needsSerial && !!s.serial && !s.serialUsed && !renewed.current;
    if (!needsSerial && !renew) return;
    const id = setTimeout(() => {
      renewed.current = true;
      reserveCardSerial(renew ? { serial: s.serial, token: s.serialToken } : {})
        .then(({ serial, token }) => update({ serial, serialToken: token, serialUsed: false, serialFor: undefined }))
        .catch(() => { /* offline: the card shows dots until saved */ });
    }, needsSerial ? 800 : 0);
    return () => clearTimeout(id);
  }, [fonts, needsSerial, s.serial, s.serialToken, s.serialUsed, update]);

  // The small animations start with the visitor's first tap or key press (until then the card is
  // drawn once), and pause while the card is scrolled out of view.
  const [live, setLive] = useState(false);
  const visible = useRef(true);
  useEffect(() => {
    const start = () => setLive(true);
    window.addEventListener("pointerdown", start, { once: true, passive: true });
    window.addEventListener("keydown", start, { once: true });
    const canvas = canvasRef.current;
    const io = canvas && new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    if (canvas) io!.observe(canvas);
    const pio = new IntersectionObserver(([e]) => e.isIntersecting && setPickerSeen(true), { threshold: 0.4 });
    if (picker.current) pio.observe(picker.current);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      io?.disconnect();
      pio.disconnect();
    };
  }, []);

  // live preview: up to ~30 frames a second, fewer on slow phones (the drawing may use at most about
  // a quarter of the time, so taps and typing stay smooth)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fonts) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, last = 0, gap = 33, drawn = false;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const t = now / 1000;
      const pulsing = t - pulseAt.current < 0.8;
      if (drawn && (!visible.current || (!live && !pulsing) || now - last < gap)) return;
      last = now;
      const pulse = Math.min(1, (t - pulseAt.current) / 0.7);
      const t0 = performance.now();
      regions.current = drawCard(ctx, s, { fonts, photo, anim: { pulse, t }, preview: true });
      gap = Math.max(33, (performance.now() - t0) * (pulsing ? 1.5 : 4));
      drawn = true;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [s, fonts, photo, live]);

  // keep the overlay maths in sync with the canvas' on-screen size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => setScale(canvas.clientWidth / CARD_W));
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // small previews of each design with the user's own details; one design per task, so the page
  // stays responsive on slow phones
  useEffect(() => {
    if (!fonts || !(pickerSeen || live)) return;
    const out: Record<string, string> = {};
    const c = document.createElement("canvas");
    c.width = 216; c.height = 270;
    const ctx = c.getContext("2d")!;
    let i = 0;
    let id = setTimeout(function next() {
      const d = DESIGNS[i++];
      ctx.setTransform(0.2, 0, 0, 0.2, 0, 0);
      drawCard(ctx, { ...s, design: d.id, palette: d.id === s.design ? s.palette : 0, size: "post" }, { fonts, photo, anim: { pulse: 1, t: 0 }, preview: false });
      out[d.id] = c.toDataURL("image/png");
      if (i < DESIGNS.length) id = setTimeout(next, 16);
      else setThumbs(out);
    }, 250);
    return () => clearTimeout(id);
  }, [s, fonts, photo, pickerSeen, live]);


  function pointToCard(e: ReactPointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * CARD_W, y: ((e.clientY - r.top) / r.height) * cardHeight(s.size) };
  }
  const inRect = (p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  const inPhoto = (p: { x: number; y: number }) => {
    const ph = regions.current?.photo;
    if (!ph) return false;
    const ry = ph.ry ?? ph.r;
    return ((p.x - ph.cx) / ph.r) ** 2 + ((p.y - ph.cy) / ry) ** 2 <= 1;
  };

  function onPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const p = pointToCard(e);
    drag.current = { x: e.clientX, y: e.clientY, moved: false, onPhoto: !!photo && inPhoto(p), dx: photo?.dx ?? 0, dy: photo?.dy ?? 0 };
    if (drag.current.onPhoto) e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const d = drag.current;
    if (!d) return;
    const mx = e.clientX - d.x, my = e.clientY - d.y;
    if (Math.hypot(mx, my) > 6) d.moved = true;
    if (d.onPhoto && d.moved && photo && regions.current) {
      const r = regions.current.photo.r * scale;
      setPhoto({ ...photo, dx: Math.max(-1.5, Math.min(1.5, d.dx + mx / r)), dy: Math.max(-1.5, Math.min(1.5, d.dy + my / r)) });
    }
  }
  function onPointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || !regions.current) return;
    const p = pointToCard(e);
    const r = regions.current;
    if (inPhoto(p)) fileInput.current?.click();
    else if (r.date && inRect(p, r.date)) setEditing("date");
    else if (inRect(p, r.name)) setEditing("name");
    else if (inRect(p, r.group)) setEditing("group");
    else if (inRect(p, r.counter)) increase();
  }
  // One more donation: the card animates (a drop falls in, a stitch, the medal shines).
  function increase() {
    if (s.count >= MAX_COUNT) return;
    pulseAt.current = performance.now() / 1000;
    update({ count: s.count + 1 });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const image = await createImageBitmap(file);
      setPhoto({ image, w: image.width, h: image.height, zoom: 1, dx: 0, dy: 0 });
    } catch {
      alert("ছবিটা খোলা যায়নি। অন্য একটা ছবি দিন।");
    }
  }

  // The card with its serial confirmed as used: the number this same card was saved with, or its
  // reservation (a new one if that expired). Without a connection the card is still made, just
  // without a number, so an unconfirmed number never ends up on two cards.
  async function withSerial(): Promise<CardState> {
    const key = serialKey(s);
    if (s.serial && s.serialUsed && s.serialFor === key) return s;
    try {
      let { serial, serialToken: token } = s;
      if (!serial || !token || s.serialUsed) ({ serial, token } = await reserveCardSerial());
      try {
        await confirmCardSerial(serial, token);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 409)) throw err;
        ({ serial, token } = await reserveCardSerial());
        await confirmCardSerial(serial, token);
      }
      const patch = { serial, serialToken: token, serialUsed: true, serialFor: key };
      update(patch);
      return { ...s, ...patch };
    } catch {
      return { ...s, serial: undefined };
    }
  }
  async function render(card: CardState): Promise<Blob | null> {
    if (!fonts) return null;
    const c = document.createElement("canvas");
    c.width = CARD_W;
    c.height = cardHeight(card.size);
    drawCard(c.getContext("2d")!, card, { fonts, photo, anim: { pulse: 1, t: 0 }, preview: false });
    return new Promise((resolve) => c.toBlob(resolve, "image/png"));
  }
  const ready = s.name.trim().length > 0 && !!s.group;
  const missing = !s.name.trim() ? "কার্ডে আপনার নাম লিখুন" : !s.group ? "রক্তের গ্রুপ বাছুন" : "";
  // Set when sharing needed a new serial and the phone then refused to share without a fresh tap.
  const [tapAgain, setTapAgain] = useState(false);

  function save(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName(s); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setDone(Date.now());
  }
  async function download() {
    if (!ready) return setEditing(!s.name.trim() ? "name" : "group");
    setBusy(true);
    const blob = await render(await withSerial());
    setBusy(false);
    if (blob) save(blob);
  }
  async function share() {
    if (!ready) return setEditing(!s.name.trim() ? "name" : "group");
    setTapAgain(false);
    setBusy(true);
    const blob = await render(await withSerial());
    setBusy(false);
    if (!blob) return;
    const file = new File([blob], fileName(s), { type: "image/png" });
    if (!navigator.canShare?.({ files: [file] })) return save(blob);
    try {
      await navigator.share({ files: [file], text: captionFor(s) });
      setDone(Date.now());
    } catch (err) {
      // Waiting for the serial can outlast the tap that allows sharing; the next tap is instant.
      if (err instanceof DOMException && err.name === "NotAllowedError") setTapAgain(true);
    }
  }
  // Only known in the browser; the server renders without the share button.
  const canShareFiles = useSyncExternalStore(noSubscribe, () => "canShare" in navigator, () => false);

  const design = DESIGNS.find((d) => d.id === s.design)!;
  const h = cardHeight(s.size);
  const r = regions.current;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-start">
      {/* ---- the card ---- */}
      <div className="lg:sticky lg:top-24 lg:order-2">
        {/* never taller than the screen (the story size is tall) */}
        <div className="relative mx-auto" style={{ width: `min(100%, 520px, calc(80vh * ${CARD_W / h}))` }}>
          <canvas
            ref={canvasRef}
            width={CARD_W}
            height={h}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="block w-full cursor-pointer touch-none rounded-2xl shadow-xl ring-1 ring-black/5"
            style={{ aspectRatio: `${CARD_W} / ${h}` }}
            aria-label="আপনার রক্তদান ফটোকার্ড। নাম, রক্তের গ্রুপ বা সংখ্যায় ট্যাপ করে বদলান।"
          />
          {!fonts && <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">লোড হচ্ছে…</div>}
          {/* writing the name directly on the card */}
          {editing === "name" && r && (
            <input
              autoFocus
              maxLength={40}
              value={s.name}
              onChange={(e) => update({ name: e.target.value })}
              onBlur={() => setEditing(null)}
              onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
              placeholder="আপনার নাম"
              className="absolute rounded-lg border-2 border-dashed border-red-500 bg-white/95 px-2 text-center font-bold text-slate-900 shadow-lg outline-none"
              style={{ left: r.name.x * scale, top: r.name.y * scale, width: r.name.w * scale, height: Math.max(40, r.name.h * scale), fontSize: Math.max(16, r.name.h * scale * 0.45) }}
            />
          )}
          {editing === "date" && r?.date && (
            <input
              type="date"
              autoFocus
              value={s.lastDate}
              max={new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10)}
              onChange={(e) => update({ lastDate: e.target.value })}
              onFocus={(e) => { try { e.currentTarget.showPicker(); } catch { /* picker opens on tap instead */ } }}
              onBlur={() => setEditing(null)}
              aria-label="শেষ রক্তদানের তারিখ"
              className="absolute rounded-full border-2 border-dashed border-red-500 bg-white/95 px-3 text-center font-semibold text-slate-900 shadow-lg outline-none"
              style={{ left: r.date.x * scale, top: r.date.y * scale, width: r.date.w * scale, height: Math.max(40, r.date.h * scale), fontSize: Math.max(14, r.date.h * scale * 0.38) }}
            />
          )}
          {editing === "group" && r && (
            <div
              className="absolute z-10 grid grid-cols-4 gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
              style={{ left: Math.max(4, Math.min(r.group.x * scale, CARD_W * scale - 224)), top: (r.group.y + r.group.h) * scale + 4, width: 220 }}
            >
              {BLOOD_GROUPS.map((g) => (
                <button key={g} type="button" onClick={() => { update({ group: g }); setEditing(null); }}
                  className={`rounded-md py-2 text-sm font-bold ${s.group === g ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mx-auto mt-3 max-w-[520px] text-center text-xs text-slate-600">
          👆 কার্ডের উপরেই ট্যাপ করুন: নাম, গ্রুপ, ছবি। {design.hint}।
        </p>
      </div>

      {/* ---- controls ---- */}
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:order-1">
        <section>
          <h2 className="text-sm font-bold text-slate-900">ডিজাইন</h2>
          <div ref={picker} className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {DESIGNS.map((d) => (
              <button key={d.id} type="button" onClick={() => update({ design: d.id, palette: 0 })}
                className={`overflow-hidden rounded-xl border-2 text-center transition ${s.design === d.id ? "border-red-600 shadow-md" : "border-transparent hover:border-slate-300"}`}>
                <span className="block aspect-[4/5] bg-slate-100">
                  {thumbs[d.id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbs[d.id]} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="block py-1 text-[11px] font-semibold text-slate-700">{d.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-900">রং</h2>
          <div className="mt-2 flex flex-wrap gap-3">
            {design.palettes.map((p, i) => (
              <button key={p.name} type="button" onClick={() => update({ palette: i })} title={p.name} aria-label={p.name}
                className={`h-11 w-11 rounded-full p-0.5 ring-2 ring-offset-2 ${s.palette === i ? "ring-slate-900" : "ring-transparent"}`}>
                <span className="block h-full w-full rounded-full" style={{ background: `linear-gradient(135deg, ${p.swatch[0]} 50%, ${p.swatch[1]} 50%)`, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.12)" }} />
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-900">কতবার রক্ত দিয়েছেন</h2>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={() => update({ count: Math.max(1, s.count - 1) })} aria-label="এক কমান"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"><Minus className="h-5 w-5" /></button>
            <div className="min-w-24 text-center">
              <span className="text-3xl font-bold text-red-600">{toBanglaNumber(s.count)}</span>
              <span className="ml-1 text-sm font-semibold text-slate-600">বার</span>
            </div>
            <button type="button" onClick={increase} aria-label="এক বাড়ান"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"><Plus className="h-5 w-5" /></button>
            <span className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{tierOf(s.count).title}</span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-900">আপনার নাম</span>
            <input value={s.name} maxLength={40} onChange={(e) => update({ name: e.target.value })} placeholder="যেমন: রাফি আহমেদ"
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-red-500 focus:outline-none" />
          </label>
          <div>
            <span className="text-sm font-bold text-slate-900">রক্তের গ্রুপ</span>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {BLOOD_GROUPS.map((g) => (
                <button key={g} type="button" onClick={() => update({ group: g as BloodGroup })}
                  className={`h-[2.6rem] rounded-md text-sm font-bold ${s.group === g ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>{g}</button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-900">ছবি <span className="font-normal text-slate-500">(ঐচ্ছিক)</span></h2>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-slate-400 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ImagePlus className="h-4 w-4" /> {photo ? "ছবি বদলান" : "আপনার ছবি যোগ করুন"}
            </button>
            {photo && (
              <>
                <label className="flex flex-1 items-center gap-2 text-xs text-slate-600">
                  জুম
                  <input type="range" min={1} max={3} step={0.05} value={photo.zoom} onChange={(e) => setPhoto({ ...photo, zoom: Number(e.target.value) })} className="flex-1 accent-red-600" />
                </label>
                <button type="button" onClick={() => setPhoto(null)} aria-label="ছবি সরান" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </div>
          {photo && <p className="mt-1 text-xs text-slate-500">কার্ডের ছবিটা টেনে সরিয়ে ঠিক জায়গায় বসান।</p>}
        </section>

        <details className="group rounded-xl bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">আরও তথ্য <span className="font-normal text-slate-500">(ঐচ্ছিক)</span></summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">জেলা</span>
              <select value={s.district} onChange={(e) => update({ district: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm">
                <option value="">দেখাবেন না</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">শেষ রক্তদান</span>
              <input type="date" value={s.lastDate} onChange={(e) => update({ lastDate: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm" />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" checked={s.showPhone} onChange={(e) => update({ showPhone: e.target.checked })} className="h-4 w-4 accent-red-600" />
              <span className="text-xs font-semibold text-slate-700">কার্ডে মোবাইল নাম্বার দেখান</span>
            </label>
            {s.showPhone && (
              <div className="sm:col-span-2">
                <input type="tel" inputMode="numeric" maxLength={11} value={s.phone} onChange={(e) => update({ phone: e.target.value.replace(/\D/g, "") })} placeholder="01XXXXXXXXX"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
                <p className="mt-1 text-[11px] text-amber-700">কার্ডটা অনেকে দেখবে; নাম্বার দিলে অচেনা কল আসতে পারে।</p>
              </div>
            )}
          </div>
        </details>

        <section>
          <h2 className="text-sm font-bold text-slate-900">মাপ</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([["post", "পোস্ট (৪:৫)"], ["story", "স্টোরি / স্ট্যাটাস (৯:১৬)"]] as const).map(([v, label]) => (
              <button key={v} type="button" onClick={() => update({ size: v })}
                className={`rounded-lg border py-2.5 text-sm font-semibold ${s.size === v ? "border-red-600 bg-red-50 text-red-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{label}</button>
            ))}
          </div>
        </section>

        <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          আপনার ছবি আর তথ্য কোথাও পাঠানো বা সংরক্ষণ করা হয় না। কার্ডটা আপনার ফোনেই তৈরি হয়।
        </p>

        {/* actions: sticky at the bottom of the screen on phones */}
        <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
          {missing && <p className="mb-2 text-center text-xs font-semibold text-red-600">{missing}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={download} disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-700 disabled:opacity-60">
              <Download className="h-5 w-5" /> ডাউনলোড
            </button>
            {canShareFiles && (
              <button type="button" onClick={share} disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-600 py-3.5 font-bold text-red-600 hover:bg-red-50 disabled:opacity-60">
                <Share2 className="h-5 w-5" /> শেয়ার
              </button>
            )}
          </div>
          {busy && <p className="mt-2 text-center text-xs text-slate-600">কার্ড নাম্বার তৈরি হচ্ছে…</p>}
          {tapAgain && !busy && <p className="mt-2 text-center text-xs font-semibold text-emerald-700">কার্ড তৈরি! শেয়ার করতে আরেকবার &quot;শেয়ার&quot; চাপুন।</p>}
        </div>
      </div>

      <Confetti show={done} />
      {done > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96">
          <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <button type="button" onClick={() => setDone(0)} aria-label="বন্ধ করুন" className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            <p className="text-lg font-bold text-slate-900">🎉 অভিনন্দন, {s.name.trim().split(" ")[0]}!</p>
            <p className="mt-1 text-sm text-slate-600">আপনি একজন {tierOf(s.count).title}। কার্ডটা শেয়ার করে অন্যদেরও রক্ত দিতে উৎসাহ দিন।</p>
            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(captionFor(s)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* no clipboard */ } }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "কপি হয়েছে" : "পোস্টের ক্যাপশন কপি করুন"}
            </button>
            <div className="mt-3 rounded-lg bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-800">রক্তদাতায় নিবন্ধিত না হলে ২০ সেকেন্ডে নিবন্ধন করুন, যেন বিপদে আপনাকে খুঁজে পাওয়া যায়।</p>
              <Link href="/register" className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700">
                <UserPlus className="h-4 w-4" /> রক্তদাতা হিসেবে নিবন্ধন
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
