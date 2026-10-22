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
