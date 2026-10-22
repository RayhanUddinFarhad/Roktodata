// Canvas features the posters and photo cards use that some phones lack: ctx.roundRect is missing in
// Safari before iOS 16, older Android browsers and some in-app browsers (Facebook, Messenger).
// Importing this file adds it where it is missing; elsewhere it does nothing.

type Radii = number | DOMPointInit | (number | DOMPointInit)[];

function roundRect(this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radii: Radii = 0) {
  const list = (Array.isArray(radii) ? radii : [radii]).map((r) => (typeof r === "number" ? r : r.x ?? 0));
  // 1-4 values in CSS order: top-left, top-right, bottom-right, bottom-left
  const [tl, tr = tl, br = tl, bl = tr] = list.length ? list : [0];
  const fit = Math.min(1, Math.abs(w) / Math.max(1e-9, tl + tr, bl + br), Math.abs(h) / Math.max(1e-9, tl + bl, tr + br));
  const [a, b, c, d] = [tl, tr, br, bl].map((r) => Math.max(0, r * fit));
  this.moveTo(x + a, y);
  this.lineTo(x + w - b, y);
  this.arcTo(x + w, y, x + w, y + b, b);
  this.lineTo(x + w, y + h - c);
  this.arcTo(x + w, y + h, x + w - c, y + h, c);
  this.lineTo(x + d, y + h);
  this.arcTo(x, y + h, x, y + h - d, d);
  this.lineTo(x, y + a);
  this.arcTo(x, y, x + a, y, a);
  this.closePath();
}

if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = roundRect;
}

// Some phone browsers (seen in an Android in-app browser) ignore textAlign "center"/"right" for Bangla
// text, so it starts at the anchor instead of ending or centring there, while measureText still gives
// the right width. This makes one context align text itself: each string is measured and drawn
// left-aligned at the computed position. Only the given context changes; calling it again is harmless.
export function alignTextManually(ctx: CanvasRenderingContext2D) {
  if (Object.prototype.hasOwnProperty.call(ctx, "fillText")) return ctx;
  const native = CanvasRenderingContext2D.prototype.fillText;
  ctx.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
    const align = this.textAlign;
    const rtl = this.direction === "rtl";
    const shift = align === "center" ? 0.5 : align === "right" || (align === "end" && !rtl) || (align === "start" && rtl) ? 1 : 0;
    if (!shift) return native.call(this, text, x, y, maxWidth);
    const width = Math.min(this.measureText(text).width, maxWidth ?? Infinity);
    this.textAlign = "left";
    native.call(this, text, x - width * shift, y, maxWidth);
    this.textAlign = align;
  };
  return ctx;
}
