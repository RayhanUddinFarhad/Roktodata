"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Loader2, Share2, X } from "lucide-react";
import "@/lib/canvasCompat";
import { toBanglaNumber, type BloodRequest } from "@/lib/data";

// The Facebook poster for a blood request (for the requester right after submitting, and for the
// admin after approving): white, one red accent, the blood group large
// (the same design as the posters made by hand). Drawn on a canvas in the browser, so Bangla text is
// shaped by the browser with the site's own fonts, and saved as a 1080 x 1350 PNG.

const W = 1080;
const H = 1350;
const RED = "#dc2626";
const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

// "2026-10-21" -> "২১ অক্টোবর ২০২৬"
function bnDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${toBanglaNumber(d)} ${MONTHS[m - 1]} ${toBanglaNumber(y)}`;
}
// Today's date in Bangladesh as "YYYY-MM-DD".
const dhakaToday = () => new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
// "01705191078" -> "01705-191078"
const formatPhone = (p: string) => (/^\d{11}$/.test(p) ? `${p.slice(0, 5)}-${p.slice(5)}` : p);

// Splits text into lines that fit `maxWidth` (on spaces).
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawPoster(request: BloodRequest): Promise<HTMLCanvasElement> {
  // The page's font stack (Hind Siliguri, with Noto Sans Bengali for digits); wait until it is loaded.
  // Some phone browsers reject or never settle font loading: then draw anyway after at most 3 seconds
  // rather than failing.
  const fonts = getComputedStyle(document.body).fontFamily;
  await Promise.race([
    Promise.allSettled([
      ...["400", "600", "700"].map(async (w) => document.fonts?.load(`${w} 40px ${fonts}`, "রক্তদাতা প্রয়োজন ০১২৩৪৫৬৭৮৯")),
      document.fonts?.ready,
    ]),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const font = (weight: number, size: number, family = fonts) => (ctx.font = `${weight} ${size}px ${family}`);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, W, 18);

  const left = 76, right = W - 76;
  // header: logo, name, "urgent"
  const logo = ctx.createLinearGradient(left, 82, left + 52, 134);
  logo.addColorStop(0, RED);
  logo.addColorStop(1, "#312e81");
  ctx.fillStyle = logo;
  ctx.beginPath();
  ctx.arc(left + 26, 108, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.save();
  ctx.translate(left + 26 - 13, 108 - 14);
  ctx.scale(26 / 24, 26 / 24);
  ctx.fill(new Path2D("M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"));
  ctx.restore();
  ctx.fillStyle = "#111827";
  font(700, 34);
  ctx.fillText("রক্তদাতা", left + 66, 120);
  ctx.fillStyle = RED;
  font(700, 26);
  ctx.textAlign = "right";
  ctx.fillText("জরুরি রক্ত প্রয়োজন", right, 118);
  const tagW = ctx.measureText("জরুরি রক্ত প্রয়োজন").width;
  ctx.beginPath();
  ctx.arc(right - tagW - 20, 109, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "left";

  // hero: the blood group, then bags and the post date
  font(700, 250, "Arial, sans-serif");
  ctx.fillStyle = RED;
  ctx.fillText(request.requiredBloodGroup, left - 6, 400);
  const groupW = ctx.measureText(request.requiredBloodGroup).width;
  const divX = left + groupW + 36;
  ctx.fillStyle = "#fee2e2";
  ctx.fillRect(divX, 214, 4, 196);
  ctx.fillStyle = "#111827";
  font(700, 64);
  ctx.fillText(`${toBanglaNumber(request.bagsNeeded)} ব্যাগ রক্ত`, divX + 40, 284);
  ctx.fillText("প্রয়োজন", divX + 40, 356);
  ctx.fillStyle = "#6b7280";
  font(400, 26);
  ctx.fillText(`পোস্ট: ${bnDate(dhakaToday())}`, divX + 40, 404);

  // details: label on the left, value (wrapped) on the right
  const today = dhakaToday();
  const needed = request.neededDate ? (request.neededDate === today ? `আজই (${bnDate(request.neededDate)})` : bnDate(request.neededDate)) : "যত দ্রুত সম্ভব";
  const rows: { label: string; value: string; sub?: string; red?: boolean }[] = [
    { label: "রোগী", value: request.patientName, sub: request.reason || undefined },
    ...(request.hospitalAddress ? [{ label: "হাসপাতাল", value: request.hospitalAddress }] : []),
    { label: "এলাকা", value: request.upazila ? `${request.upazila}, ${request.district}` : request.district },
    { label: "কবে প্রয়োজন", value: needed, red: true },
  ];
  const valueX = left + 244, valueW = right - valueX;
  let y = 480;
  const rule = (at: number) => { ctx.fillStyle = "#f3f4f6"; ctx.fillRect(left, at, right - left, 2); };
  rule(y);
  for (const row of rows) {
    font(700, 38);
    const lines = wrap(ctx, row.value, valueW).slice(0, 3);
    const top = y + 24;
    ctx.fillStyle = "#9ca3af";
    font(600, 26);
    ctx.fillText(row.label, left, top + 34);
    ctx.fillStyle = row.red ? RED : "#111827";
    font(700, 38);
    lines.forEach((line, i) => ctx.fillText(line, valueX, top + 38 + i * 48));
    let h = 38 + (lines.length - 1) * 48 + 14;
    if (row.sub) {
      ctx.fillStyle = "#6b7280";
      font(400, 27);
      ctx.fillText(wrap(ctx, row.sub, valueW)[0], valueX, top + h + 26);
      h += 38;
    }
    y = top + h + 24;
    rule(y);
  }

  // contact
  const boxY = y + 44, boxH = 150;
  ctx.fillStyle = "#fef2f2";
  ctx.beginPath();
  ctx.roundRect(left, boxY, right - left, boxH, 28);
  ctx.fill();
  ctx.fillStyle = "#991b1b";
  font(600, 25);
  ctx.fillText("রক্ত দিতে পারলে যোগাযোগ করুন", left + 40, boxY + 50);
  ctx.fillStyle = "#111827";
  // the number in Arial, like the blood group: clear on every phone, with no web font to wait for
  font(700, 60, "Arial, Helvetica, sans-serif");
  ctx.fillText(formatPhone(request.requesterPhone), left + 40, boxY + 116);
  ctx.fillStyle = "#6b7280";
  font(600, 24);
  ctx.textAlign = "right";
  ctx.fillText("কল করুন", right - 40, boxY + 66);
  ctx.fillText("বা WhatsApp করুন", right - 40, boxY + 100);
  ctx.textAlign = "left";

  // footer
  ctx.fillStyle = "#374151";
  font(600, 26);
  ctx.fillText("রক্ত দিতে না পারলেও শেয়ার করুন", left, H - 92);
  ctx.fillStyle = "#9ca3af";
  font(400, 22);
  ctx.fillText("আপনার একটি শেয়ারে বাঁচতে পারে একটি প্রাণ", left, H - 58);
  ctx.fillStyle = RED;
  font(700, 30, "Arial, sans-serif");
  ctx.textAlign = "right";
  ctx.fillText("roktodata.org", right, H - 60);
  ctx.textAlign = "left";
  return canvas;
}

const fileName = (r: BloodRequest) => `roktodata-${r.requiredBloodGroup.replace("+", "pos").replace("-", "neg")}-${dhakaToday()}.png`;

// Text to post with the poster.
export function requestCaption(r: BloodRequest) {
  return [
    `🩸 জরুরি ${r.requiredBloodGroup} রক্ত প্রয়োজন (${toBanglaNumber(r.bagsNeeded)} ব্যাগ)`,
    `রোগী: ${r.patientName}${r.reason ? ` (${r.reason})` : ""}`,
    ...(r.hospitalAddress ? [`হাসপাতাল: ${r.hospitalAddress}`] : []),
    `এলাকা: ${r.upazila ? `${r.upazila}, ${r.district}` : r.district}`,
    ...(r.neededDate ? [`কবে: ${bnDate(r.neededDate)}`] : []),
    `যোগাযোগ: ${formatPhone(r.requesterPhone)}`,
    "",
    "রক্ত দিতে না পারলেও শেয়ার করুন 🙏",
    `আরও ${r.requiredBloodGroup} রক্তদাতা খুঁজুন: https://www.roktodata.org`,
    "#রক্তদাতা #রক্ত_প্রয়োজন #Roktodata",
  ].join("\n");
}

type PosterImageState = { url: string; file: File } | null;

// Draws the poster once and keeps it as an image URL and a PNG file.
function usePoster(request: BloodRequest) {
  const [image, setImage] = useState<PosterImageState>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let url = "";
    drawPoster(request)
      .then((canvas) => new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no image"))), "image/png")))
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage({ url, file: new File([blob], fileName(request), { type: "image/png" }) });
      })
      .catch((err) => {
        console.error("Poster could not be drawn:", err);
        if (!cancelled) setError("পোস্টার তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [request, attempt]);
  const retry = () => {
    setError("");
    setAttempt((n) => n + 1);
  };
  return { image, error, retry };
}

function PosterImage({ request, image, error, onRetry }: { request: BloodRequest; image: PosterImageState; error: string; onRetry: () => void }) {
  return (
    <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={`${request.requiredBloodGroup} রক্তের অনুরোধের পোস্টার`} className="h-full w-full object-contain" />
      ) : error ? (
        <div className="p-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            আবার চেষ্টা করুন
          </button>
        </div>
      ) : (
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      )}
    </div>
  );
}

// Share (on phones straight to Facebook, WhatsApp...), download, and copy the caption. Where files
// can't be shared (most computers), "ফেসবুকে পোস্ট করুন" downloads the poster, copies the caption and
// opens Facebook, so the picture only needs to be attached.
function PosterActions({ request, image }: { request: BloodRequest; image: PosterImageState }) {
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState("");
  const canShareFile = !!image && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [image.file] });
  const caption = requestCaption(request);
  async function copy() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }
  function download() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image.url;
    a.download = image.file.name;
    a.click();
  }
  async function share() {
    if (!image) return;
    if (canShareFile) {
      try {
        await navigator.share({ files: [image.file], text: caption });
      } catch {
        // cancelled
      }
      return;
    }
    download();
    await copy();
    window.open("https://www.facebook.com/", "_blank", "noopener");
    setHint("পোস্টার ডাউনলোড হয়েছে আর ক্যাপশন কপি হয়েছে। ফেসবুকে নতুন পোস্টে ছবিটা যোগ করে ক্যাপশন পেস্ট করুন।");
  }
  const btn = "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50";
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={share} disabled={!image} className={`${btn} col-span-2 bg-[#1462cc] text-white hover:bg-[#0f52ad]`}>
          <Share2 className="h-4 w-4" /> {canShareFile ? "ফেসবুক / WhatsApp-এ শেয়ার" : "ফেসবুকে পোস্ট করুন"}
        </button>
        <button type="button" onClick={download} disabled={!image} className={`${btn} bg-red-600 text-white hover:bg-red-700`}>
          <Download className="h-4 w-4" /> ডাউনলোড
        </button>
        <button type="button" onClick={copy} className={`${btn} border border-slate-300 text-slate-700 hover:bg-slate-50`}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "কপি হয়েছে" : "ক্যাপশন কপি"}
        </button>
      </div>
      {hint && <p className="mt-2 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

// Shown on the request form right after submitting: the poster with share and download buttons.
export function RequestPosterPanel({ request }: { request: BloodRequest }) {
  const poster = usePoster(request);
  return (
    <div className="mt-6 grid gap-5 rounded-2xl border border-red-100 bg-linear-to-br from-red-50 to-white p-4 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-center sm:p-5">
      <div className="mx-auto w-full max-w-[260px]">
        <PosterImage request={request} image={poster.image} error={poster.error} onRetry={poster.retry} />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-900">🎉 আপনার অনুরোধের পোস্টার তৈরি</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          পোস্টারটা ফেসবুকে নিজের টাইমলাইন আর এলাকার রক্তদান গ্রুপগুলোতে পোস্ট করুন। যত বেশি মানুষ দেখবে, তত দ্রুত রক্তদাতা পাবেন।
        </p>
        <div className="mt-4">
          <PosterActions request={request} image={poster.image} />
        </div>
      </div>
    </div>
  );
}

// The admin's dialog with the poster, opened after approving a request.
export function RequestPosterDialog({ request, onClose }: { request: BloodRequest; onClose: () => void }) {
  const poster = usePoster(request);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-slate-900">ফেসবুক পোস্টার</p>
          <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <PosterImage request={request} image={poster.image} error={poster.error} onRetry={poster.retry} />
        <div className="mt-3">
          <PosterActions request={request} image={poster.image} />
        </div>
      </div>
    </div>
  );
}
