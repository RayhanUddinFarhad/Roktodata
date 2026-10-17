// Removes keys that could be read as MongoDB operators or paths ("$gt", "a.b")
// and prototype-pollution keys from request bodies and route params.
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value === null || typeof value !== "object") return value;

  const result = {};
  for (const [key, inner] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes(".") || FORBIDDEN_KEYS.has(key)) continue;
    result[key] = clean(inner);
  }
  return result;
}

export function sanitizeInput(req, _res, next) {
  if (req.body) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  // req.query is re-parsed on every access in Express 5, so it cannot be rewritten here.
  // The app uses the "simple" query parser (strings only) and every route validates it with zod.
  next();
}
