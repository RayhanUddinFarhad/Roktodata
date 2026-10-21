// Drawing for the "আমি যতবার রক্ত দিয়েছি" photo cards. Everything is drawn on a canvas (so Bangla is
// shaped by the browser with the site's fonts) in a 1080 x 1350 card; the story size (1080 x 1920)
// draws the same card in the middle of a taller background.
// Each design returns where its editable parts are, so the page can make them tappable.
import { toBanglaNumber, type BloodGroup } from "@/lib/data";

export const CARD_W = 1080;
export const CARD_H = 1350;
export const STORY_H = 1920;

export type DesignId = "bag" | "idcard" | "countdown" | "certificate" | "nakshi" | "medal";
export type CardSize = "post" | "story";

export interface CardState {
  design: DesignId;
  palette: number;
  name: string;
  group: BloodGroup | "";
  count: number;
  district: string;
  lastDate: string; // "YYYY-MM-DD" or ""
  phone: string; // shown only when showPhone
  showPhone: boolean;
  size: CardSize;
}

export interface Photo {
  image: CanvasImageSource;
  w: number;
  h: number;
  zoom: number; // 1 = cover the circle
  dx: number; // offset in photo-circle units (-1..1)
  dy: number;
}

export interface Fonts {
  body: string; // font-family stack of the page (Hind Siliguri, Noto digits)
  deco: string; // decorative Bangla (Galada) for the certificate and nakshi names
}

// Animation state: `pulse` runs 0 -> 1 after the count goes up (1 when idle), `t` is time in seconds.
export interface Anim {
  pulse: number;
  t: number;
}

export type Rect = { x: number; y: number; w: number; h: number };
export interface Regions {
  name: Rect;
  group: Rect;
  counter: Rect;
  photo: { cx: number; cy: number; r: number; ry?: number };
  date?: Rect; // the last-donation date, where a design shows it
}

interface Options {
  fonts: Fonts;
  photo: Photo | null;
  anim: Anim;
  preview: boolean; // draw hints for empty fields (never in the saved image)
}

// ---- titles by count ---------------------------------------------------------------------------
export const TIERS = [
  { min: 50, title: "প্লাটিনাম রক্তবীর", medal: ["#f1f5f9", "#cbd5e1", "#64748b"] },
  { min: 25, title: "গোল্ড রক্তযোদ্ধা", medal: ["#fff3b0", "#f5c542", "#b7791f"] },
  { min: 10, title: "সিলভার রক্তযোদ্ধা", medal: ["#ffffff", "#d1d5db", "#6b7280"] },
  { min: 5, title: "ব্রোঞ্জ রক্তযোদ্ধা", medal: ["#fde2c4", "#d08a4c", "#8a4b1c"] },
  { min: 2, title: "রক্তবন্ধু", medal: ["#ffe4e6", "#f59fa8", "#b4535e"] },
  { min: 1, title: "প্রথম রক্তদান", medal: ["#ffe4e6", "#f59fa8", "#b4535e"] },
] as const;
export const tierOf = (n: number) => TIERS.find((t) => n >= t.min) ?? TIERS[TIERS.length - 1];
const MILESTONES = [5, 10, 25, 50, 100, 200];
export const nextMilestone = (n: number) => MILESTONES.find((m) => m > n) ?? n;

// ---- palettes -----------------------------------------------------------------------------------
export const DESIGNS: { id: DesignId; label: string; hint: string; palettes: { name: string; swatch: [string, string] }[] }[] = [
  { id: "idcard", label: "ডোনার আইডি কার্ড", hint: "মোট রক্তদানের ঘরে ট্যাপ করলে সংখ্যা বাড়ে", palettes: [
    { name: "লাল", swatch: ["#fff1f2", "#c81e1e"] }, { name: "নেভি", swatch: ["#eef2ff", "#1e3a8a"] },
    { name: "সবুজ", swatch: ["#ecfdf5", "#047857"] }, { name: "কালো-সোনালি", swatch: ["#1c1917", "#b7791f"] }] },
  { id: "bag", label: "রক্তের ব্যাগ", hint: "ব্যাগে ট্যাপ করলে এক ফোঁটা রক্ত যোগ হয়", palettes: [
    { name: "ক্লাসিক", swatch: ["#fbf1e6", "#c81e1e"] }, { name: "গোলাপি", swatch: ["#fde8ec", "#be123c"] },
    { name: "রাত", swatch: ["#0f172a", "#f43f5e"] }, { name: "পুদিনা", swatch: ["#e7f6f0", "#dc2626"] }] },
  { id: "countdown", label: "রক্তদান কাউন্টডাউন", hint: "তারিখে ট্যাপ করে শেষ রক্তদানের দিন দিন", palettes: [
    { name: "লাল", swatch: ["#fff5f5", "#dc2626"] }, { name: "ফিরোজা", swatch: ["#ecfeff", "#0891b2"] }, { name: "রাত", swatch: ["#1e1b4b", "#f43f5e"] }] },
  { id: "certificate", label: "সম্মাননা সনদ", hint: "ডটেড লাইনে ট্যাপ করে নাম লিখুন", palettes: [
    { name: "মেরুন-সোনালি", swatch: ["#fdf6e3", "#7f1d1d"] }, { name: "সবুজ-সোনালি", swatch: ["#f3f8ef", "#14532d"] }, { name: "নীল-রুপালি", swatch: ["#f4f6fa", "#1e3a8a"] }] },
  { id: "nakshi", label: "নকশিকাঁথা", hint: "প্রতিবার একটা করে ফোঁটা সেলাই হয়", palettes: [
    { name: "লাল-নীল", swatch: ["#f6eedc", "#b91c1c"] }, { name: "সবুজ-হলুদ", swatch: ["#f3f1dc", "#15803d"] }, { name: "মেরুন-ফিরোজা", swatch: ["#f7ece6", "#881337"] }] },
  { id: "medal", label: "মেডেল", hint: "মেডেলে ট্যাপ করুন, সংখ্যা বাড়লে ধাতু বদলায়", palettes: [
    { name: "নেভি-সোনালি", swatch: ["#1e1b4b", "#f5c542"] }, { name: "কালো-সোনালি", swatch: ["#111111", "#f5c542"] }, { name: "সবুজ-লাল", swatch: ["#064e3b", "#dc2626"] }] },
];

const BAG = [
  { bg: "#fbf1e6", accent: "#c81e1e", blood: ["#e11d48", "#9f1239"], ink: "#3f1d1d", muted: "#9a8f86", stroke: "#b9a99a", pill: "#ffffff" },
  { bg: "#fde8ec", accent: "#be123c", blood: ["#f43f5e", "#9f1239"], ink: "#4c0519", muted: "#9f7a83", stroke: "#d4a5b0", pill: "#ffffff" },
  { bg: "#0f172a", accent: "#fb7185", blood: ["#fb7185", "#be123c"], ink: "#f8fafc", muted: "#94a3b8", stroke: "#64748b", pill: "#1e293b" },
  { bg: "#e7f6f0", accent: "#dc2626", blood: ["#ef4444", "#991b1b"], ink: "#064e3b", muted: "#6b8f80", stroke: "#9cc3b3", pill: "#ffffff" },
];
const CERT = [
  { bg: "#fdf6e3", frame: "#b8892b", main: "#7f1d1d", text: "#5b4636", soft: "#efe3c6" },
  { bg: "#f3f8ef", frame: "#b8892b", main: "#14532d", text: "#3f4f3a", soft: "#e2eed8" },
  { bg: "#f4f6fa", frame: "#94a3b8", main: "#1e3a8a", text: "#475569", soft: "#e2e8f0" },
];
const NAKSHI = [
  { bg: "#f6eedc", weave: "#e9dcc0", a: "#b91c1c", b: "#1e3a8a", c: "#d97706", fill: "#fde7e7" },
  { bg: "#f3f1dc", weave: "#e4dfbd", a: "#15803d", b: "#a16207", c: "#dc2626", fill: "#e3f3e6" },
  { bg: "#f7ece6", weave: "#ead8cc", a: "#881337", b: "#0f766e", c: "#ea580c", fill: "#fbe4ea" },
];
const MEDAL = [
  { bg: ["#312e81", "#0f172a"], ribbon: ["#1d4ed8", "#dc2626"], text: "#ffffff", sub: "#cbd5e1", accent: "#fde047", ray: "#fde68a" },
  { bg: ["#262626", "#0a0a0a"], ribbon: ["#171717", "#f5c542"], text: "#ffffff", sub: "#d4d4d4", accent: "#f5c542", ray: "#fde68a" },
  { bg: ["#065f46", "#022c22"], ribbon: ["#16a34a", "#dc2626"], text: "#ffffff", sub: "#d1fae5", accent: "#fca5a5", ray: "#bbf7d0" },
];

// ---- helpers ------------------------------------------------------------------------------------
const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
export const bnDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return y && m && d ? `${toBanglaNumber(d)} ${MONTHS[m - 1]} ${toBanglaNumber(y)}` : "";
};
const formatPhone = (p: string) => (/^\d{11}$/.test(p) ? `${p.slice(0, 5)}-${p.slice(5)}` : p);
const LATIN = "Arial, Helvetica, sans-serif";

function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number, family: string) {
  ctx.font = `${weight} ${size}px ${family}`;
}
// Draws text no wider than maxW (shrinking the size if needed); returns the size used.
function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, size: number, weight: number, family: string, min = 18) {
  let s = size;
  setFont(ctx, weight, s, family);
  while (s > min && ctx.measureText(text).width > maxW) setFont(ctx, weight, (s -= 2), family);
  ctx.fillText(text, x, y);
  return s;
}
function dropPath(ctx: CanvasRenderingContext2D, cx: number, top: number, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.bezierCurveTo(cx - w * 0.22, top + h * 0.3, cx - w / 2, top + h * 0.48, cx - w / 2, top + h * 0.68);
  ctx.bezierCurveTo(cx - w / 2, top + h * 0.88, cx - w * 0.28, top + h, cx, top + h);
  ctx.bezierCurveTo(cx + w * 0.28, top + h, cx + w / 2, top + h * 0.88, cx + w / 2, top + h * 0.68);
  ctx.bezierCurveTo(cx + w / 2, top + h * 0.48, cx + w * 0.22, top + h * 0.3, cx, top);
  ctx.closePath();
}
function photoOrPlaceholder(ctx: CanvasRenderingContext2D, photo: Photo | null, cx: number, cy: number, rx: number, ry: number, bg: string, fg: string, preview: boolean, square = false) {
  ctx.save();
  ctx.beginPath();
  if (square) ctx.roundRect(cx - rx, cy - ry, rx * 2, ry * 2, 22);
  else ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = bg;
  ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  if (photo) {
    const cover = Math.max((rx * 2) / photo.w, (ry * 2) / photo.h) * photo.zoom;
    const w = photo.w * cover, h = photo.h * cover;
    ctx.drawImage(photo.image, cx - w / 2 + photo.dx * rx, cy - h / 2 + photo.dy * ry, w, h);
  } else {
    // a simple person silhouette
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(cx, cy - ry * 0.18, rx * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry * 0.78, rx * 0.72, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    if (preview) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(cx - rx, cy + ry * 0.35, rx * 2, ry);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      setFont(ctx, 700, Math.max(16, rx * 0.3), "sans-serif");
      ctx.fillText("+ ছবি", cx, cy + ry * 0.68);
    }
  }
  ctx.restore();
}
// Dashed "tap to write" box around an empty field (preview only).
function hint(ctx: CanvasRenderingContext2D, r: Rect, color: string, t: number) {
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 4);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 16);
  ctx.stroke();
  ctx.restore();
}
function nameOrHint(ctx: CanvasRenderingContext2D, name: string, preview: boolean) {
  return name.trim() || (preview ? "ট্যাপ করে নাম লিখুন" : "");
}
function footer(ctx: CanvasRenderingContext2D, s: CardState, fonts: Fonts, y: number, muted: string, accent: string) {
  ctx.textAlign = "center";
  if (s.showPhone && s.phone) {
    ctx.fillStyle = muted;
    setFont(ctx, 600, 26, fonts.body);
    ctx.fillText(`যোগাযোগ: ${formatPhone(s.phone)}`, 540, y - 46);
  }
  setFont(ctx, 600, 26, fonts.body);
  const a = "আপনিও রক্তদাতা হোন · ";
  setFont(ctx, 700, 26, LATIN);
  const bw = ctx.measureText("roktodata.org").width;
  setFont(ctx, 600, 26, fonts.body);
  const aw = ctx.measureText(a).width;
  const x0 = 540 - (aw + bw) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = muted;
  ctx.fillText(a, x0, y);
  ctx.fillStyle = accent;
  setFont(ctx, 700, 26, LATIN);
  ctx.fillText("roktodata.org", x0 + aw, y);
  ctx.textAlign = "center";
}
// A small medal dot in the tier colour (instead of an emoji, which looks different on every phone).
function tierDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, n: number) {
  const [a, b, c] = tierOf(n).medal;
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r);
  g.addColorStop(0, a);
  g.addColorStop(0.6, b);
  g.addColorStop(1, c);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ---- 1. blood bag -------------------------------------------------------------------------------
function drawBag(ctx: CanvasRenderingContext2D, s: CardState, o: Options): Regions {
  const p = BAG[s.palette] ?? BAG[0];
  const { fonts, anim } = o;
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = p.accent;
  ctx.globalAlpha = 0.07;
  for (let y = 20; y < CARD_H; y += 60) for (let x = 20 + ((y / 60) % 2) * 30; x < CARD_W; x += 60) { dropPath(ctx, x, y, 10, 14); ctx.fill(); }
  ctx.globalAlpha = 1;
  // header
  ctx.fillStyle = p.accent;
  ctx.beginPath(); ctx.arc(96, 92, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; dropPath(ctx, 96, 76, 18, 26); ctx.fill();
  ctx.fillStyle = p.ink; ctx.textAlign = "left"; setFont(ctx, 700, 34, fonts.body); ctx.fillText("রক্তদাতা", 138, 104);
  const tier = tierOf(s.count).title;
  setFont(ctx, 700, 26, fonts.body);
  const tw = ctx.measureText(tier).width + 80;
  ctx.fillStyle = p.pill; ctx.strokeStyle = p.stroke; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(1016 - tw, 64, tw, 58, 29); ctx.fill(); ctx.stroke();
  tierDot(ctx, 1016 - tw + 32, 93, 13, s.count);
  ctx.fillStyle = p.muted; ctx.fillText(tier, 1016 - tw + 54, 103);
  // headline and the count
  ctx.textAlign = "center"; ctx.fillStyle = p.ink; setFont(ctx, 600, 44, fonts.body); ctx.fillText("আমি রক্ত দিয়েছি", 540, 200);
  const bump = 1 + 0.12 * Math.sin(Math.min(1, anim.pulse) * Math.PI);
  ctx.save(); ctx.translate(540, 268); ctx.scale(bump, bump);
  ctx.fillStyle = p.accent; setFont(ctx, 700, 92, fonts.body); ctx.fillText(`${toBanglaNumber(s.count)} বার`, 0, 32);
  ctx.restore();
  // the bag
  const bag = new Path2D("M330 380 Q330 350 360 350 L720 350 Q750 350 750 380 L750 1010 Q750 1060 700 1060 L380 1060 Q330 1060 330 1010 Z");
  ctx.strokeStyle = p.stroke; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.roundRect(500, 318, 80, 46, 14); ctx.stroke();
  ctx.save(); ctx.clip(bag);
  ctx.fillStyle = s.palette === 2 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"; ctx.fillRect(320, 340, 440, 730);
  const target = nextMilestone(s.count);
  const level = Math.max(0.1, Math.min(1, s.count / target));
  const top = 1060 - level * 640;
  const g = ctx.createLinearGradient(0, top, 0, 1060); g.addColorStop(0, p.blood[0]); g.addColorStop(1, p.blood[1]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(320, top);
  for (let x = 320; x <= 760; x += 10) ctx.lineTo(x, top + Math.sin(x / 40 + anim.t * 3) * 8);
  ctx.lineTo(760, 1080); ctx.lineTo(320, 1080); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  for (const [x, y0, r] of [[420, 960, 10], [660, 1000, 7], [560, 1030, 12]]) { const y = y0 - ((anim.t * 40 + x) % 200); if (y > top + 14) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); } }
  ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.roundRect(352, 370, 26, 660, 13); ctx.fill();
  ctx.restore();
  ctx.stroke(bag);
  ctx.strokeStyle = p.stroke; ctx.lineWidth = 4; ctx.beginPath();
  for (const y of [480, 600, 720, 840, 960]) { ctx.moveTo(720, y); ctx.lineTo(692, y); }
  ctx.stroke();
  // a drop falling in after each tap
  if (anim.pulse < 1) {
    const yy = 300 + anim.pulse * (top - 300);
    ctx.fillStyle = p.blood[0]; dropPath(ctx, 610, yy - 40, 30, 44); ctx.fill();
  }
  // ports and tube
  ctx.fillStyle = s.palette === 2 ? "#334155" : "#e7dccf"; ctx.lineWidth = 5;
  for (const x of [440, 600]) { ctx.beginPath(); ctx.roundRect(x, 1056, 40, 60, 8); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = p.accent; ctx.globalAlpha = 0.85; ctx.lineWidth = 16; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(620, 1116); ctx.bezierCurveTo(620, 1200, 860, 1180, 860, 1060); ctx.bezierCurveTo(860, 940, 820, 900, 860, 820); ctx.stroke();
  ctx.globalAlpha = 1; ctx.lineCap = "butt";
  // the label
  ctx.save(); ctx.translate(540, 560); ctx.rotate((-2 * Math.PI) / 180); ctx.translate(-540, -560);
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#e5d5c3"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(372, 400, 336, 330, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = p.accent; ctx.beginPath(); ctx.roundRect(372, 400, 336, 52, [16, 16, 0, 0]); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; setFont(ctx, 700, 22, fonts.body); ctx.fillText("রক্তদাতা · BLOOD DONOR", 540, 436);
  ctx.textAlign = "left"; ctx.fillStyle = p.accent;
  if (s.group) fitText(ctx, s.group, 392, 580, 190, 128, 700, LATIN);
  else if (o.preview) { ctx.globalAlpha = 0.5; setFont(ctx, 700, 26, fonts.body); ctx.fillText("গ্রুপ বাছুন", 396, 548); ctx.globalAlpha = 1; }
  photoOrPlaceholder(ctx, o.photo, 642, 530, 48, 48, "#f1e7dc", "#cbb8a5", o.preview);
  ctx.strokeStyle = p.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(642, 530, 48, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = s.name.trim() ? "#1f2937" : "#9ca3af";
  fitText(ctx, nameOrHint(ctx, s.name, o.preview), 392, 636, 296, s.name.trim() ? 30 : 24, 700, fonts.body);
  const meta = [s.district, s.lastDate ? `শেষ: ${bnDate(s.lastDate)}` : ""].filter(Boolean).join(" · ");
  ctx.fillStyle = "#6b7280"; if (meta) fitText(ctx, meta, 392, 672, 296, 22, 400, fonts.body);
  ctx.fillStyle = "#1f2937";
  [4, 2, 6, 2, 4, 2, 6, 3, 2, 5].reduce((x, w) => { ctx.fillRect(x, 690, w, 26); return x + w + 4; }, 392);
  ctx.fillStyle = "#9ca3af"; ctx.textAlign = "right"; setFont(ctx, 600, 20, fonts.body);
  ctx.fillText(`${toBanglaNumber(s.count)} / ${toBanglaNumber(target)}`, 688, 712);
  ctx.restore();
  const regions: Regions = { name: { x: 384, y: 600, w: 312, h: 50 }, group: { x: 384, y: 462, w: 200, h: 130 }, counter: { x: 330, y: 220, w: 420, h: 840 }, photo: { cx: 642, cy: 530, r: 52 } };
  if (o.preview && !s.name.trim()) hint(ctx, regions.name, p.accent, anim.t);
  ctx.fillStyle = p.ink; ctx.textAlign = "center"; setFont(ctx, 600, 30, fonts.body);
  ctx.fillText("আমার রক্তে বাঁচে কারো প্রিয়জন", 540, s.showPhone && s.phone ? 1176 : 1212);
  footer(ctx, s, fonts, 1290, p.muted, p.accent);
  return regions;
}

// ---- 2. donor ID card ---------------------------------------------------------------------------
const IDCARD = [
  { bg: ["#fff1f2", "#fde2e4"], band: "#c81e1e", band2: "#991b1b", strap: "#dc2626", ink: "#1f2937", soft: "#fef2f2", accent: "#c81e1e" },
  { bg: ["#eef2ff", "#dbe4ff"], band: "#1e3a8a", band2: "#172554", strap: "#1d4ed8", ink: "#1f2937", soft: "#eff6ff", accent: "#dc2626" },
  { bg: ["#ecfdf5", "#d1fae5"], band: "#047857", band2: "#065f46", strap: "#059669", ink: "#1f2937", soft: "#f0fdf4", accent: "#dc2626" },
  { bg: ["#1c1917", "#0c0a09"], band: "#1c1917", band2: "#b7791f", strap: "#b7791f", ink: "#1f2937", soft: "#fefce8", accent: "#b7791f" },
];
// The white card with its soft shadow. A blur this large is slow to draw, so it is drawn once and
// reused on every frame.
let shadowCache: HTMLCanvasElement | null = null;
function idCardShadow(x0: number, y0: number, w: number, h: number) {
  if (!shadowCache) {
    shadowCache = document.createElement("canvas");
    shadowCache.width = CARD_W;
    shadowCache.height = CARD_H;
    const c = shadowCache.getContext("2d")!;
    c.shadowColor = "rgba(0,0,0,0.25)"; c.shadowBlur = 50; c.shadowOffsetY = 20;
    c.fillStyle = "#ffffff"; c.beginPath(); c.roundRect(x0, y0, w, h, 36); c.fill();
  }
  return shadowCache;
}

function drawIdCard(ctx: CanvasRenderingContext2D, s: CardState, o: Options): Regions {
  const p = IDCARD[s.palette] ?? IDCARD[0];
  const { fonts, anim } = o;
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, p.bg[0]);
  bg.addColorStop(1, p.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  // faint plus signs in the background
  ctx.strokeStyle = p.band;
  ctx.globalAlpha = 0.07;
  ctx.lineWidth = 6;
  for (let y = 40; y < CARD_H; y += 110) for (let x = 40 + ((y / 110) % 2) * 55; x < CARD_W; x += 110) {
    ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // lanyard strap with the name printed on it, and the metal clip
  const sway = Math.sin(anim.t * 1.4) * 0.6;
  ctx.save();
  ctx.translate(540, 0);
  ctx.rotate((sway * Math.PI) / 180);
  ctx.fillStyle = p.strap;
  ctx.beginPath(); ctx.moveTo(-150, -10); ctx.lineTo(-38, 150); ctx.lineTo(38, 150); ctx.lineTo(150, -10); ctx.lineTo(80, -10); ctx.lineTo(0, 110); ctx.lineTo(-80, -10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.textAlign = "center"; setFont(ctx, 700, 18, LATIN);
  ctx.save(); ctx.translate(-92, 50); ctx.rotate(0.95); ctx.fillText("ROKTODATA", 0, 6); ctx.restore();
  ctx.save(); ctx.translate(92, 50); ctx.rotate(-0.95); ctx.fillText("ROKTODATA", 0, 6); ctx.restore();
  const clip = ctx.createLinearGradient(-40, 140, 40, 230);
  clip.addColorStop(0, "#f8fafc"); clip.addColorStop(0.5, "#94a3b8"); clip.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = clip; ctx.beginPath(); ctx.roundRect(-40, 140, 80, 92, 14); ctx.fill();
  ctx.fillStyle = "#64748b"; ctx.beginPath(); ctx.roundRect(-22, 196, 44, 36, 8); ctx.fill();
  ctx.restore();

  // the card
  const x0 = 200, y0 = 220, w = 680, h = 960;
  ctx.drawImage(idCardShadow(x0, y0, w, h), 0, 0);
  ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 36); ctx.clip();
  // header band
  const band = ctx.createLinearGradient(x0, y0, x0 + w, y0 + 200);
  band.addColorStop(0, p.band); band.addColorStop(1, p.band2);
  ctx.fillStyle = band; ctx.fillRect(x0, y0, w, 200);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.arc(x0 + w - 40, y0 + 10, 160, 0, Math.PI * 2); ctx.fill();
  // slot for the clip
  ctx.fillStyle = p.bg[1]; ctx.beginPath(); ctx.roundRect(490, y0 + 20, 100, 22, 11); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x0 + 70, y0 + 108, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.band; dropPath(ctx, x0 + 70, y0 + 90, 22, 32); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.textAlign = "left"; setFont(ctx, 700, 36, fonts.body); ctx.fillText("রক্তদাতা", x0 + 118, y0 + 108);
  setFont(ctx, 700, 20, LATIN); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText("BLOOD DONOR ID", x0 + 120, y0 + 140);
  ctx.textAlign = "right"; setFont(ctx, 600, 22, fonts.body); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText("রক্তদাতা পরিচয়পত্র", x0 + w - 40, y0 + 108);
  ctx.restore();

  // photo
  const px = 540, py = y0 + 320, prx = 112, pry = 130;
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(px - prx - 12, py - pry - 12, 2 * prx + 24, 2 * pry + 24, 28); ctx.fill();
  photoOrPlaceholder(ctx, o.photo, px, py, prx, pry, p.soft, "#d6d3d1", o.preview, true);
  ctx.strokeStyle = p.band; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(px - prx, py - pry, 2 * prx, 2 * pry, 22); ctx.stroke();
  // hologram sticker that shimmers
  const hx = x0 + w - 92, hy = y0 + 300;
  const holo = ctx.createLinearGradient(hx - 46 + Math.sin(anim.t * 2) * 30, hy - 46, hx + 46, hy + 46);
  holo.addColorStop(0, "#a5f3fc"); holo.addColorStop(0.35, "#f0abfc"); holo.addColorStop(0.7, "#fde68a"); holo.addColorStop(1, "#86efac");
  ctx.fillStyle = holo; ctx.beginPath(); ctx.arc(hx, hy, 46, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 34, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)"; dropPath(ctx, hx, hy - 20, 22, 34); ctx.fill();

  // name and title
  ctx.textAlign = "center";
  ctx.fillStyle = s.name.trim() ? p.ink : "#9ca3af";
  fitText(ctx, nameOrHint(ctx, s.name, o.preview), 540, y0 + 524, w - 80, s.name.trim() ? 54 : 36, 700, fonts.body, 28);
  const tier = tierOf(s.count).title;
  setFont(ctx, 700, 26, fonts.body);
  const tw = ctx.measureText(tier).width + 74;
  ctx.fillStyle = p.soft; ctx.beginPath(); ctx.roundRect(540 - tw / 2, y0 + 546, tw, 48, 24); ctx.fill();
  tierDot(ctx, 540 - tw / 2 + 28, y0 + 570, 12, s.count);
  ctx.fillStyle = p.band === "#1c1917" ? "#92400e" : p.band; ctx.textAlign = "left"; ctx.fillText(tier, 540 - tw / 2 + 48, y0 + 580);

  // details: blood group | total donations, then district | last donation
  const gx = x0 + 40, gy = y0 + 616, cw = (w - 100) / 2, ch = 120;
  const box = (x: number, y: number, label: string, glow = 0) => {
    ctx.fillStyle = p.soft; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 20); ctx.fill();
    if (glow > 0) { ctx.strokeStyle = p.accent; ctx.globalAlpha = glow; ctx.lineWidth = 6; ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.fillStyle = "#6b7280"; ctx.textAlign = "left"; setFont(ctx, 600, 22, fonts.body); ctx.fillText(label, x + 24, y + 38);
  };
  box(gx, gy, "রক্তের গ্রুপ");
  ctx.fillStyle = p.accent;
  if (s.group) fitText(ctx, s.group, gx + 24, gy + 100, cw - 48, 60, 700, LATIN);
  else if (o.preview) { ctx.globalAlpha = 0.5; setFont(ctx, 700, 28, fonts.body); ctx.fillText("ট্যাপ করে বাছুন", gx + 24, gy + 92); ctx.globalAlpha = 1; }
  const glow = anim.pulse < 1 ? Math.sin(anim.pulse * Math.PI) : 0;
  box(gx + cw + 20, gy, "মোট রক্তদান", glow);
  const bump = 1 + 0.12 * glow;
  ctx.save(); ctx.translate(gx + cw + 44, gy + 100); ctx.scale(bump, bump);
  ctx.fillStyle = p.ink; setFont(ctx, 700, 60, fonts.body); ctx.fillText(toBanglaNumber(s.count), 0, 0);
  const nw = ctx.measureText(toBanglaNumber(s.count)).width;
  setFont(ctx, 700, 30, fonts.body); ctx.fillStyle = "#6b7280"; ctx.fillText(" বার", nw, 0);
  ctx.restore();
  if (o.preview) { ctx.fillStyle = p.accent; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(gx + 2 * cw + 2, gy + 34, 18, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; setFont(ctx, 700, 26, LATIN); ctx.fillText("+", gx + 2 * cw + 2, gy + 43); }
  const row2 = gy + ch + 20;
  const line = (x: number, label: string, value: string) => {
    ctx.textAlign = "left"; ctx.fillStyle = "#6b7280"; setFont(ctx, 600, 22, fonts.body); ctx.fillText(label, x, row2 + 26);
    ctx.fillStyle = p.ink; fitText(ctx, value || "—", x, row2 + 64, cw - 10, 30, 700, fonts.body, 18);
  };
  line(gx + 4, "জেলা", s.district);
  line(gx + cw + 24, "শেষ রক্তদান", s.lastDate ? bnDate(s.lastDate) : "");
  // barcode, ID and the phone number when shown
  const by = y0 + h - 52;
  ctx.fillStyle = "#1f2937";
  let bx = gx + 4;
  for (let i = 0; i < 34; i++) { const bw = [2, 4, 2, 6, 3][(i * 7 + s.count) % 5]; ctx.fillRect(bx, by - 30, bw, 44); bx += bw + 3; }
  const yy = new Date(Date.now() + 6 * 3600e3).toISOString().slice(2, 4);
  ctx.textAlign = "right"; setFont(ctx, 700, 22, LATIN); ctx.fillStyle = "#6b7280";
  ctx.fillText(`ID: RD-${yy}-${(s.group || "XX").replace("+", "P").replace("-", "N")}-${String(s.count).padStart(3, "0")}`, x0 + w - 40, by - 8);
  if (s.showPhone && s.phone) { setFont(ctx, 700, 22, LATIN); ctx.fillStyle = p.ink; ctx.fillText(formatPhone(s.phone), x0 + w - 40, by + 20); }
  else { ctx.fillStyle = p.accent; ctx.fillText("roktodata.org", x0 + w - 40, by + 20); }

  const regions: Regions = {
    name: { x: x0 + 30, y: y0 + 474, w: w - 60, h: 66 },
    group: { x: gx, y: gy, w: cw, h: ch },
    counter: { x: gx + cw + 20, y: gy, w: cw, h: ch },
    photo: { cx: px, cy: py, r: prx, ry: pry },
  };
  if (o.preview && !s.name.trim()) hint(ctx, regions.name, p.accent, anim.t);
  // under the card
  ctx.textAlign = "center"; ctx.fillStyle = p.band === "#1c1917" ? "#e7e5e4" : p.ink; setFont(ctx, 600, 28, fonts.body);
  ctx.fillText("আমার রক্তে বাঁচে কারো প্রিয়জন", 540, 1240);
  footer(ctx, { ...s, showPhone: false }, fonts, 1294, p.band === "#1c1917" ? "#a8a29e" : "#6b7280", p.band === "#1c1917" ? "#fbbf24" : p.accent);
  return regions;
}

// ---- 3. donation countdown ----------------------------------------------------------------------
// Days between donations; the site hides donors from search until this many days have passed
// (ELIGIBILITY_DAYS in the backend).
export const DONATION_GAP_DAYS = 90;
const COUNTDOWN = [
  { bg: ["#fff5f5", "#ffe4e6"], ring: "#dc2626", track: "#fecdd3", ink: "#1f2937", muted: "#6b7280", chip: "#ffffff", ready: "#16a34a" },
  { bg: ["#ecfeff", "#cffafe"], ring: "#0891b2", track: "#a5f3fc", ink: "#164e63", muted: "#4b7a88", chip: "#ffffff", ready: "#059669" },
  { bg: ["#1e1b4b", "#0f172a"], ring: "#f43f5e", track: "#334155", ink: "#f8fafc", muted: "#cbd5e1", chip: "#1e293b", ready: "#4ade80" },
];
const DAY_MS = 86400000;
const dhakaTodayYmd = () => new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
const ymdToUtc = (ymd: string) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
// Where a donor stands: days since the last donation, days left, the next date (null without a date).
export function countdownOf(lastDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastDate)) return null;
  const since = Math.max(0, Math.round((ymdToUtc(dhakaTodayYmd()) - ymdToUtc(lastDate)) / DAY_MS));
  const next = new Date(ymdToUtc(lastDate) + DONATION_GAP_DAYS * DAY_MS).toISOString().slice(0, 10);
  return { since, left: Math.max(0, DONATION_GAP_DAYS - since), next, ready: since >= DONATION_GAP_DAYS };
}
function drawCountdown(ctx: CanvasRenderingContext2D, s: CardState, o: Options): Regions {
  const p = COUNTDOWN[s.palette] ?? COUNTDOWN[0];
  const { fonts, anim } = o;
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, p.bg[0]);
  bg.addColorStop(1, p.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const cd = countdownOf(s.lastDate);
  const ready = !cd || cd.ready; // without a date, the card says "ready"
  const main = ready ? p.ready : p.ring;

  // header
  ctx.fillStyle = p.ring; ctx.beginPath(); ctx.arc(96, 92, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; dropPath(ctx, 96, 76, 18, 26); ctx.fill();
  ctx.fillStyle = p.ink; ctx.textAlign = "left"; setFont(ctx, 700, 34, fonts.body); ctx.fillText("রক্তদাতা", 138, 104);
  ctx.textAlign = "right"; ctx.fillStyle = p.muted; setFont(ctx, 600, 26, fonts.body); ctx.fillText("রক্তদান কাউন্টডাউন", 1000, 102);

  // the message
  ctx.textAlign = "center";
  if (ready) {
    ctx.fillStyle = p.ink; setFont(ctx, 700, 58, fonts.body); ctx.fillText("আমি আবার রক্তদানের", 540, 210);
    ctx.fillStyle = main; setFont(ctx, 700, 72, fonts.body); ctx.fillText("জন্য প্রস্তুত!", 540, 296);
  } else {
    ctx.fillStyle = p.ink; setFont(ctx, 700, 54, fonts.body); ctx.fillText("আবার রক্ত দিতে পারব", 540, 220);
    ctx.fillStyle = p.muted; setFont(ctx, 600, 36, fonts.body); ctx.fillText(`${bnDate(cd!.next)} থেকে`, 540, 284);
  }

  // the ring: how much of the 90 days has passed
  const cx = 540, cy = 600, r = 230;
  const frac = cd ? Math.min(1, cd.since / DONATION_GAP_DAYS) : 1;
  const sweep = anim.pulse < 1 ? frac * Easing(anim.pulse) : frac;
  ctx.lineCap = "round";
  ctx.strokeStyle = p.track; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = main; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + sweep * Math.PI * 2); ctx.stroke();
  ctx.lineCap = "butt";
  // tick marks for the three months
  ctx.strokeStyle = p.chip; ctx.lineWidth = 6;
  for (const k of [1, 2]) { const a = -Math.PI / 2 + (k / 3) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r - 22), cy + Math.sin(a) * (r - 22)); ctx.lineTo(cx + Math.cos(a) * (r + 22), cy + Math.sin(a) * (r + 22)); ctx.stroke(); }
  // a drop riding at the end of the arc
  const ea = -Math.PI / 2 + sweep * Math.PI * 2;
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + Math.cos(ea) * r, cy + Math.sin(ea) * r, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = main; dropPath(ctx, cx + Math.cos(ea) * r, cy + Math.sin(ea) * r - 18, 24, 34); ctx.fill();
  // inside the ring
  if (ready) {
    const pop = 1 + 0.06 * Math.sin(anim.t * 3);
    ctx.save(); ctx.translate(cx, cy - 40); ctx.scale(pop, pop);
    ctx.fillStyle = main; ctx.beginPath(); ctx.arc(0, 0, 92, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 18; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(-40, 2); ctx.lineTo(-10, 32); ctx.lineTo(44, -26); ctx.stroke(); ctx.lineCap = "butt";
    ctx.restore();
    ctx.fillStyle = main; setFont(ctx, 700, 52, fonts.body); ctx.fillText("প্রস্তুত!", cx, cy + 112);
    // sparkles
    ctx.fillStyle = "#facc15";
    for (let i = 0; i < 6; i++) { const a = anim.t * 0.8 + (i * Math.PI) / 3, rr = r - 70 + 10 * Math.sin(anim.t * 3 + i); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 7, 0, Math.PI * 2); ctx.fill(); }
  } else {
    ctx.fillStyle = p.ink; setFont(ctx, 700, 170, fonts.body); ctx.fillText(toBanglaNumber(cd!.left), cx, cy + 40);
    ctx.fillStyle = p.muted; setFont(ctx, 700, 40, fonts.body); ctx.fillText("দিন বাকি", cx, cy + 104);
  }

  // dates (tap to set the last donation date)
  const chipY = 880;
  const chipText = cd ? `শেষ রক্তদান: ${bnDate(s.lastDate)}` : o.preview ? "শেষ রক্তদানের তারিখ দিন" : "";
  setFont(ctx, 600, 30, fonts.body);
  const chipW = Math.max(360, ctx.measureText(chipText).width + 110);
  if (chipText) {
    ctx.fillStyle = p.chip; ctx.beginPath(); ctx.roundRect(540 - chipW / 2, chipY, chipW, 66, 33); ctx.fill();
    // a small calendar icon
    const ix = 540 - chipW / 2 + 40, iy = chipY + 18;
    ctx.strokeStyle = main; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(ix - 14, iy, 28, 30, 5); ctx.stroke();
    ctx.fillStyle = main; ctx.fillRect(ix - 14, iy, 28, 9);
    ctx.fillStyle = cd ? p.ink : p.muted; ctx.textAlign = "left"; ctx.fillText(chipText, ix + 30, chipY + 44); ctx.textAlign = "center";
  }

  // who: photo, name, group, donations so far
  const rowY = 1010;
  photoOrPlaceholder(ctx, o.photo, 200, rowY + 40, 62, 62, p.track, p.chip, o.preview);
  ctx.strokeStyle = main; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(200, rowY + 40, 62, 0, Math.PI * 2); ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = s.name.trim() ? p.ink : p.muted;
  fitText(ctx, nameOrHint(ctx, s.name, o.preview), 290, rowY + 30, 600, s.name.trim() ? 48 : 32, 700, fonts.body, 26);
  const groupText = s.group || (o.preview ? "গ্রুপ?" : "");
  setFont(ctx, 700, 28, s.group ? LATIN : fonts.body);
  const gw = ctx.measureText(groupText).width + 36;
  if (groupText) {
    ctx.fillStyle = main; ctx.beginPath(); ctx.roundRect(290, rowY + 50, gw, 46, 23); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(groupText, 308, rowY + 83);
  }
  const bump = 1 + 0.15 * Math.sin(Math.min(1, anim.pulse) * Math.PI);
  ctx.save(); ctx.translate(290 + gw + 22, rowY + 83); ctx.scale(bump, bump);
  ctx.fillStyle = p.muted; setFont(ctx, 600, 28, fonts.body); ctx.fillText(`এ পর্যন্ত ${toBanglaNumber(s.count)} বার রক্তদান`, 0, 0);
  ctx.restore();
  setFont(ctx, 600, 28, fonts.body);
  const cw = ctx.measureText(`এ পর্যন্ত ${toBanglaNumber(s.count)} বার রক্তদান`).width;

  const regions: Regions = {
    name: { x: 280, y: rowY - 20, w: 640, h: 64 },
    group: { x: 286, y: rowY + 46, w: gw + 8, h: 54 },
    counter: { x: 290 + gw + 12, y: rowY + 46, w: cw + 20, h: 54 },
    photo: { cx: 200, cy: rowY + 40, r: 66 },
    date: { x: 540 - chipW / 2, y: chipY - 4, w: chipW, h: 74 },
  };
  if (o.preview && !s.name.trim()) hint(ctx, regions.name, main, anim.t);
  if (o.preview && !cd) hint(ctx, regions.date!, main, anim.t);
  ctx.textAlign = "center"; ctx.fillStyle = p.muted; setFont(ctx, 600, 26, fonts.body);
  ctx.fillText(ready ? "যার রক্ত লাগবে, আমাকে খুঁজে নিন রক্তদাতায়" : "তিন মাস পরপর রক্ত দেওয়া যায়", 540, 1200);
  footer(ctx, s, fonts, 1286, p.muted, p.ring);
  return regions;
}
// ease-out for the ring sweep after a tap
function Easing(t: number) {
  return 1 - (1 - t) ** 3;
}

// ---- 4. certificate -----------------------------------------------------------------------------
function drawCertificate(ctx: CanvasRenderingContext2D, s: CardState, o: Options): Regions {
  const p = CERT[s.palette] ?? CERT[0];
  const { fonts, anim } = o;
  ctx.fillStyle = p.bg; ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.strokeStyle = p.frame; ctx.lineWidth = 10; ctx.strokeRect(40, 40, 1000, 1270);
  ctx.strokeStyle = p.main; ctx.lineWidth = 3; ctx.strokeRect(64, 64, 952, 1222);
  ctx.fillStyle = p.frame;
  for (const [x, y, sx, sy] of [[64, 64, 1, 1], [1016, 64, -1, 1], [64, 1286, 1, -1], [1016, 1286, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 86 * sx, y); ctx.quadraticCurveTo(x + 36 * sx, y + 36 * sy, x, y + 86 * sy); ctx.closePath(); ctx.fill();
  }
  photoOrPlaceholder(ctx, o.photo, 540, 230, 92, 110, p.soft, "#d6c39c", o.preview);
  ctx.strokeStyle = p.frame; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(540, 230, 92, 110, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = p.main; setFont(ctx, 400, 84, fonts.deco); ctx.fillText("রক্তযোদ্ধা সম্মাননা", 540, 430);
  ctx.fillStyle = p.text; setFont(ctx, 400, 30, fonts.body); ctx.fillText("এই মর্মে সম্মান জানানো যাচ্ছে যে", 540, 500);
  ctx.fillStyle = s.name.trim() ? "#1f2937" : "#a8a29e";
  fitText(ctx, nameOrHint(ctx, s.name, o.preview), 540, 620, 640, s.name.trim() ? 104 : 56, 400, fonts.deco, 40);
  ctx.strokeStyle = p.frame; ctx.lineWidth = 4; ctx.setLineDash([4, 10]); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(220, 650); ctx.lineTo(860, 650); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = "butt";
  // "{group} রক্তের গ্রুপের একজন রক্তদাতা হিসেবে এ পর্যন্ত" with the group in the main colour
  const g = s.group || (o.preview ? "গ্রুপ?" : "");
  const rest = g ? " রক্তের গ্রুপের একজন রক্তদাতা হিসেবে এ পর্যন্ত" : "একজন রক্তদাতা হিসেবে এ পর্যন্ত";
  setFont(ctx, 700, 32, s.group ? LATIN : fonts.body); const gw = g ? ctx.measureText(g).width : 0;
  setFont(ctx, 400, 32, fonts.body); const rw = ctx.measureText(rest).width;
  const x0 = 540 - (gw + rw) / 2;
  ctx.textAlign = "left";
  if (g) { ctx.fillStyle = p.main; setFont(ctx, 700, 32, s.group ? LATIN : fonts.body); ctx.fillText(g, x0, 730); }
  ctx.fillStyle = p.text; setFont(ctx, 400, 32, fonts.body); ctx.fillText(rest, x0 + gw, 730);
  ctx.textAlign = "center";
  const bump = 1 + 0.1 * Math.sin(Math.min(1, anim.pulse) * Math.PI);
  ctx.save(); ctx.translate(540, 820); ctx.scale(bump, bump);
  ctx.fillStyle = p.main; setFont(ctx, 700, 130, fonts.body); ctx.fillText(`${toBanglaNumber(s.count)} বার`, 0, 40); ctx.restore();
  ctx.fillStyle = p.text; setFont(ctx, 400, 32, fonts.body); ctx.fillText("রক্ত দিয়ে মানুষের জীবন বাঁচাতে এগিয়ে এসেছেন।", 540, 930);
  // seal (bounces when the count goes up)
  ctx.save(); ctx.translate(250, 1110); const st = 1 + 0.15 * Math.sin(Math.min(1, anim.pulse) * Math.PI); ctx.scale(st, st);
  ctx.fillStyle = p.main; ctx.beginPath(); ctx.moveTo(-60, 80); ctx.lineTo(-80, 170); ctx.lineTo(-40, 150); ctx.lineTo(-20, 180); ctx.lineTo(0, 90); ctx.fill();
  ctx.beginPath(); ctx.moveTo(60, 80); ctx.lineTo(80, 170); ctx.lineTo(40, 150); ctx.lineTo(20, 180); ctx.lineTo(0, 90); ctx.fill();
  const [m1, m2, m3] = tierOf(s.count).medal; const sg = ctx.createRadialGradient(-30, -30, 4, 0, 0, 96); sg.addColorStop(0, m1); sg.addColorStop(0.6, m2); sg.addColorStop(1, m3);
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 96, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = p.bg; ctx.lineWidth = 4; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = p.main; dropPath(ctx, 0, -46, 44, 72); ctx.fill();
  setFont(ctx, 700, 22, fonts.body); fitText(ctx, tierOf(s.count).title.split(" ")[0], 0, 62, 130, 24, 700, fonts.body);
  ctx.restore();
  ctx.strokeStyle = p.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(640, 1150); ctx.lineTo(900, 1150); ctx.stroke();
  ctx.fillStyle = p.main; setFont(ctx, 400, 44, fonts.deco); ctx.fillText("রক্তদাতা পরিবার", 770, 1130);
  ctx.fillStyle = p.text; setFont(ctx, 400, 24, fonts.body);
  const today = new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
  ctx.fillText(bnDate(today), 770, 1190);
  if (s.district) { setFont(ctx, 600, 26, fonts.body); ctx.fillText(s.district, 770, 1226); }
  const regions: Regions = { name: { x: 210, y: 530, w: 660, h: 130 }, group: { x: x0 - 10, y: 696, w: Math.max(gw + 20, 80), h: 48 }, counter: { x: 330, y: 760, w: 420, h: 120 }, photo: { cx: 540, cy: 230, r: 100, ry: 116 } };
  if (o.preview && !s.name.trim()) hint(ctx, regions.name, p.main, anim.t);
  footer(ctx, s, fonts, 1264, p.text, p.main);
  return regions;
}

// ---- 5. nakshi kantha ---------------------------------------------------------------------------
function stitchedDrop(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, filled: boolean, progress = 1) {
  dropPath(ctx, x, y, 24, 34);
  if (filled && progress >= 1) { ctx.fillStyle = color; ctx.fill(); }
  ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.setLineDash([5, 4]);
  if (progress < 1) { ctx.setLineDash([5 * progress + 0.01, 400]); }
  ctx.stroke(); ctx.setLineDash([]);
}
function drawNakshi(ctx: CanvasRenderingContext2D, s: CardState, o: Options): Regions {
  const p = NAKSHI[s.palette] ?? NAKSHI[0];
  const { fonts, anim } = o;
  ctx.fillStyle = p.bg; ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.strokeStyle = p.weave; ctx.lineWidth = 1;
  ctx.beginPath(); for (let i = -CARD_H; i < CARD_W; i += 8) { ctx.moveTo(i, 0); ctx.lineTo(i + CARD_H, CARD_H); } ctx.stroke();
  const dashed = (color: string, w: number, dash: number[], fn: () => void) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash); ctx.beginPath(); fn(); ctx.stroke(); ctx.setLineDash([]); };
  dashed(p.a, 6, [18, 12], () => ctx.rect(46, 46, 988, 1258));
  dashed(p.b, 5, [10, 10], () => ctx.rect(76, 76, 928, 1198));
  dashed(p.c, 5, [8, 8], () => { ctx.moveTo(110, 110); ctx.lineTo(970, 110); ctx.moveTo(110, 1240); ctx.lineTo(970, 1240); });
  ctx.fillStyle = p.a;
  for (const x of [110, 190, 270, 810, 890, 970]) { ctx.beginPath(); ctx.moveTo(x, 130); ctx.lineTo(x + 20, 160); ctx.lineTo(x - 20, 160); ctx.closePath(); ctx.fill(); }
  // corner lotuses
  for (const cx of [150, 930]) dashed(p.b, 4, [6, 6], () => {
    ctx.moveTo(cx, 1160); ctx.quadraticCurveTo(cx - 40, 1100, cx, 1050); ctx.quadraticCurveTo(cx + 40, 1100, cx, 1160);
    ctx.moveTo(cx, 1160); ctx.quadraticCurveTo(cx - 70, 1130, cx - 80, 1070); ctx.quadraticCurveTo(cx - 20, 1080, cx, 1160);
    ctx.moveTo(cx, 1160); ctx.quadraticCurveTo(cx + 70, 1130, cx + 80, 1070); ctx.quadraticCurveTo(cx + 20, 1080, cx, 1160);
  });
  ctx.textAlign = "center"; ctx.fillStyle = p.b; setFont(ctx, 400, 66, fonts.deco); ctx.fillText("আমার রক্তদানের গল্প", 540, 236);
  // photo in a stitched circle
  photoOrPlaceholder(ctx, o.photo, 540, 340, 62, 62, p.fill, p.weave, o.preview);
  dashed(p.a, 5, [10, 7], () => ctx.arc(540, 340, 70, 0, Math.PI * 2));
  // big stitched drop with the number
  const bump = 1 + 0.08 * Math.sin(Math.min(1, anim.pulse) * Math.PI);
  ctx.save(); ctx.translate(540, 640); ctx.scale(bump, bump); ctx.translate(-540, -640);
  dropPath(ctx, 540, 430, 320, 400); ctx.fillStyle = p.fill; ctx.fill();
  ctx.strokeStyle = p.a; ctx.lineWidth = 8; ctx.setLineDash([20, 10]); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = p.a; setFont(ctx, 700, 150, fonts.body); ctx.fillText(toBanglaNumber(s.count), 540, 720);
  setFont(ctx, 700, 40, fonts.body); ctx.fillText("বার", 540, 776);
  ctx.restore();
  // one small drop stitched per donation (two rows of 15, then "+N")
  const shown = Math.min(s.count, 30);
  for (let i = 0; i < shown; i++) {
    const row = Math.floor(i / 15), col = i % 15, inRow = Math.min(15, shown - row * 15);
    const x = 540 + (col - (inRow - 1) / 2) * 44, y = 858 + row * 50;
    const newest = i === shown - 1 && anim.pulse < 1;
    stitchedDrop(ctx, x, y, row % 2 ? p.b : p.a, true, newest ? anim.pulse : 1);
    if (newest) { // the needle
      ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 3; ctx.beginPath();
      const nx = x + 14 * Math.cos(anim.pulse * 6.3), ny = y + 18 + 16 * Math.sin(anim.pulse * 6.3);
      ctx.moveTo(nx, ny); ctx.lineTo(nx + 30, ny - 30); ctx.stroke();
    }
  }
  // "+N" after the second row, so it stays clear of the name
  if (s.count > 30) { ctx.fillStyle = p.b; setFont(ctx, 700, 30, fonts.body); ctx.textAlign = "left"; ctx.fillText(`+${toBanglaNumber(s.count - 30)}`, 540 + 7 * 44 + 30, 918); ctx.textAlign = "center"; }
  ctx.fillStyle = s.name.trim() ? "#1f2937" : "#a8a29e";
  fitText(ctx, nameOrHint(ctx, s.name, o.preview), 540, 1040, 720, s.name.trim() ? 72 : 46, 400, fonts.deco, 36);
  const pillText = [s.group || (o.preview ? "গ্রুপ?" : ""), s.district].filter(Boolean).join(" · ");
  setFont(ctx, 700, 30, fonts.body); const pw = Math.max(200, ctx.measureText(pillText).width + 70);
  dashed(p.c, 4, [8, 6], () => ctx.roundRect(540 - pw / 2, 1068, pw, 54, 27));
  ctx.fillStyle = p.b; ctx.fillText(pillText, 540, 1105);
  const regions: Regions = { name: { x: 200, y: 976, w: 680, h: 84 }, group: { x: 540 - pw / 2, y: 1064, w: pw, h: 62 }, counter: { x: 360, y: 420, w: 360, h: 420 }, photo: { cx: 540, cy: 340, r: 74 } };
  if (o.preview && !s.name.trim()) hint(ctx, regions.name, p.a, anim.t);
  footer(ctx, s, fonts, 1216, "#6b5b3e", p.a); // the phone line sits at 1170, clear of the pill
  return regions;
}

// ---- 6. medal -----------------------------------------------------------------------------------
function drawMedal(ctx: CanvasRenderingContext2D, s: CardState, o: Options): Regions {
  const p = MEDAL[s.palette] ?? MEDAL[0];
  const { fonts, anim } = o;
  const bg = ctx.createRadialGradient(540, 520, 40, 540, 520, 900); bg.addColorStop(0, p.bg[0]); bg.addColorStop(0.7, p.bg[1]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = p.ray; ctx.translate(540, 560); ctx.rotate(anim.t * 0.08);
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -1100); ctx.lineTo(60, -1100); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // confetti
  const conf = [[160, 200, "#f43f5e"], [880, 240, "#22c55e"], [230, 700, "#fde047"], [860, 660, "#38bdf8"], [820, 420, "#fde047"], [220, 460, "#38bdf8"], [140, 980, "#f472b6"], [940, 900, "#a3e635"]] as const;
  for (const [x, y, c] of conf) { ctx.save(); ctx.translate(x, y + Math.sin(anim.t * 2 + x) * 8); ctx.rotate(anim.t + x); ctx.fillStyle = c; ctx.fillRect(-8, -14, 16, 28); ctx.restore(); }
  // ribbon
  ctx.fillStyle = p.ribbon[0]; ctx.beginPath(); ctx.moveTo(420, 120); ctx.lineTo(500, 380); ctx.lineTo(560, 380); ctx.lineTo(480, 120); ctx.fill();
  ctx.fillStyle = p.ribbon[1]; ctx.beginPath(); ctx.moveTo(660, 120); ctx.lineTo(580, 380); ctx.lineTo(520, 380); ctx.lineTo(600, 120); ctx.fill();
  // medal, in the metal of the current tier; it shines after each tap
  const bump = 1 + 0.08 * Math.sin(Math.min(1, anim.pulse) * Math.PI);
  ctx.save(); ctx.translate(540, 560); ctx.scale(bump, bump);
  const [m1, m2, m3] = tierOf(s.count).medal;
  const mg = ctx.createRadialGradient(-70, -80, 10, 0, 0, 240); mg.addColorStop(0, m1); mg.addColorStop(0.5, m2); mg.addColorStop(1, m3);
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0, 0, 220, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = m3; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 186, 0, Math.PI * 2); ctx.stroke();
  // text around the rim
  ctx.fillStyle = m3; setFont(ctx, 700, 28, fonts.body);
  const rim = "রক্তযোদ্ধা • ROKTODATA • রক্তযোদ্ধা • ROKTODATA •";
  const chars = [...rim]; let ang = -Math.PI * 0.92;
  for (const ch of chars) { const w = ctx.measureText(ch).width; ctx.save(); ctx.rotate(ang + w / 2 / 203); ctx.translate(0, -203); ctx.fillText(ch, 0, 10); ctx.restore(); ang += w / 203; if (ang > Math.PI * 0.92) break; }
  dropPath(ctx, 0, -120, 180, 260); ctx.fillStyle = "#dc2626"; ctx.fill();
  ctx.textAlign = "center"; ctx.fillStyle = "#fff"; fitText(ctx, toBanglaNumber(s.count), 0, 92, 160, 110, 700, fonts.body);
  ctx.fillStyle = "#fecaca"; setFont(ctx, 700, 30, fonts.body); ctx.fillText("বার", 0, 132);
  if (anim.pulse < 1) { // shine sweep
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 220, 0, Math.PI * 2); ctx.clip();
    const sx = -300 + anim.pulse * 600; const sh = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0);
    sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.5, "rgba(255,255,255,0.7)"); sh.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sh; ctx.rotate(-0.5); ctx.fillRect(-320, -320, 640, 640); ctx.restore();
  }
  ctx.restore();
  photoOrPlaceholder(ctx, o.photo, 540, 160, 70, 70, "#1e293b", "#475569", o.preview);
  ctx.strokeStyle = tierOf(s.count).medal[1]; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(540, 160, 70, 0, Math.PI * 2); ctx.stroke();
  ctx.textAlign = "center"; ctx.fillStyle = s.name.trim() ? p.text : "rgba(255,255,255,0.55)";
  fitText(ctx, nameOrHint(ctx, s.name, o.preview), 540, 900, 820, s.name.trim() ? 80 : 46, 700, fonts.body, 36);
  const line = [s.group ? `${s.group} রক্তদাতা` : o.preview ? "গ্রুপ?" : "রক্তদাতা", s.district].filter(Boolean).join(" · ");
  ctx.fillStyle = p.sub; setFont(ctx, 600, 34, fonts.body); ctx.fillText(line, 540, 970);
  const lw = ctx.measureText(line).width;
  const tier = tierOf(s.count).title; setFont(ctx, 700, 32, fonts.body); const tw = ctx.measureText(tier).width + 90;
  ctx.fillStyle = tierOf(s.count).medal[1]; ctx.beginPath(); ctx.roundRect(540 - tw / 2, 1010, tw, 70, 35); ctx.fill();
  tierDot(ctx, 540 - tw / 2 + 38, 1045, 15, s.count);
  ctx.fillStyle = "#1f2937"; ctx.textAlign = "left"; ctx.fillText(tier, 540 - tw / 2 + 62, 1056); ctx.textAlign = "center";
  ctx.fillStyle = "#e2e8f0"; setFont(ctx, 600, 30, fonts.body);
  ctx.fillText("আমার রক্তে বাঁচে কারো প্রিয়জন", 540, s.showPhone && s.phone ? 1150 : 1180);
  const regions: Regions = { name: { x: 140, y: 830, w: 800, h: 90 }, group: { x: 540 - lw / 2 - 10, y: 930, w: lw + 20, h: 54 }, counter: { x: 320, y: 340, w: 440, h: 440 }, photo: { cx: 540, cy: 160, r: 74 } };
  if (o.preview && !s.name.trim()) hint(ctx, regions.name, p.accent, anim.t);
  footer(ctx, s, fonts, 1270, "#94a3b8", p.accent);
  return regions;
}

const DRAW: Record<DesignId, (ctx: CanvasRenderingContext2D, s: CardState, o: Options) => Regions> = {
  bag: drawBag, idcard: drawIdCard, countdown: drawCountdown, certificate: drawCertificate, nakshi: drawNakshi, medal: drawMedal,
};

// The background colour that fills the extra space of the story size.
const STORY_BG: Record<DesignId, (palette: number) => string> = {
  bag: (i) => (BAG[i] ?? BAG[0]).bg,
  idcard: (i) => (IDCARD[i] ?? IDCARD[0]).bg[1],
  countdown: (i) => (COUNTDOWN[i] ?? COUNTDOWN[0]).bg[1],
  certificate: (i) => (CERT[i] ?? CERT[0]).bg,
  nakshi: (i) => (NAKSHI[i] ?? NAKSHI[0]).bg,
  medal: (i) => (MEDAL[i] ?? MEDAL[0]).bg[1],
};

// Draws the whole card on a canvas already sized to the card (1080 x 1350 or 1080 x 1920) and
// returns the editable regions in canvas pixels.
export function drawCard(ctx: CanvasRenderingContext2D, s: CardState, o: Options): Regions {
  const h = s.size === "story" ? STORY_H : CARD_H;
  ctx.save();
  ctx.clearRect(0, 0, CARD_W, h);
  let dy = 0;
  if (s.size === "story") {
    dy = (STORY_H - CARD_H) / 2;
    ctx.fillStyle = STORY_BG[s.design](s.palette);
    ctx.fillRect(0, 0, CARD_W, STORY_H);
  }
  ctx.translate(0, dy);
  const r = DRAW[s.design](ctx, s, o);
  ctx.restore();
  if (s.size === "story") {
    // continue the card's own background into the extra space by stretching its edges
    ctx.drawImage(ctx.canvas, 0, dy, CARD_W, 2, 0, 0, CARD_W, dy);
    ctx.drawImage(ctx.canvas, 0, dy + CARD_H - 2, CARD_W, 2, 0, dy + CARD_H, CARD_W, dy);
  }
  const shift = (rect: Rect): Rect => ({ ...rect, y: rect.y + dy });
  return { name: shift(r.name), group: shift(r.group), counter: shift(r.counter), photo: { ...r.photo, cy: r.photo.cy + dy }, date: r.date && shift(r.date) };
}

export const cardHeight = (size: CardSize) => (size === "story" ? STORY_H : CARD_H);

// Caption to post with the card.
export const captionFor = (s: CardState) =>
  `আমি এ পর্যন্ত ${toBanglaNumber(s.count)} বার রক্ত দিয়েছি${s.group ? ` (${s.group})` : ""}। 🩸\n` +
  `আমার রক্তে বাঁচে কারো প্রিয়জন। আপনিও রক্তদাতা হোন, যেন বিপদে আপনাকে খুঁজে পাওয়া যায়।\n` +
  `👉 https://www.roktodata.org/register\n#রক্তদাতা #রক্তদান #Roktodata`;
