import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

// Requires "Authorization: Bearer <admin JWT>" issued by POST /api/admin/login.
export function requireAdmin(req, _res, next) {
  const [scheme, token] = (req.get("authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError(401, "অ্যাডমিন লগইন প্রয়োজন।"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    if (payload.role !== "admin") throw new Error("not an admin token");
    req.admin = payload;
    next();
  } catch {
    next(new AppError(401, "লগইনের মেয়াদ শেষ হয়েছে। আবার লগইন করুন।"));
  }
}
