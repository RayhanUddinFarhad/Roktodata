// The visitor's approximate location from their IP address (Vercel adds it to every request), so
// blood-request notifications can go to people nearby. Empty when unknown (e.g. local development).
export function GET(request: Request) {
  const lat = Number(request.headers.get("x-vercel-ip-latitude"));
  const lng = Number(request.headers.get("x-vercel-ip-longitude"));
  const known = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  return Response.json(known ? { lat, lng } : {}, { headers: { "Cache-Control": "private, no-store" } });
}
