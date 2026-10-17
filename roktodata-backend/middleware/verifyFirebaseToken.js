import { env } from "../config/env.js";
import { firebaseAuth } from "../config/firebase.js";
import { AppError } from "../utils/AppError.js";

// Requires "Authorization: Bearer <Firebase ID token>" and attaches the decoded token as req.user.
export async function verifyFirebaseToken(req, _res, next) {
  const header = req.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError(401, "লগইন প্রয়োজন। মোবাইল নাম্বার যাচাই করে আবার চেষ্টা করুন।"));
  }

  try {
    req.user = await firebaseAuth.verifyIdToken(token);
    next();
  } catch {
    next(new AppError(401, "লগইনের মেয়াদ শেষ বা সঠিক নয়। আবার যাচাই করুন।"));
  }
}

// Applies verifyFirebaseToken only while phone verification is turned on (REQUIRE_PHONE_VERIFICATION).
export function phoneVerification(req, res, next) {
  if (!env.REQUIRE_PHONE_VERIFICATION) return next();
  return verifyFirebaseToken(req, res, next);
}
