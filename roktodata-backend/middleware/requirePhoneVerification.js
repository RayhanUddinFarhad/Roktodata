import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { verifyPhoneToken } from "../utils/phoneToken.js";

// While REQUIRE_PHONE_VERIFICATION is on, requires "Authorization: Bearer <phone token>" from
// POST /api/otp/verify and sets req.verifiedPhone. The handler checks it matches the profile.
export function requirePhoneVerification(req, _res, next) {
  if (!env.REQUIRE_PHONE_VERIFICATION) return next();

  const [scheme, token] = (req.get("authorization") ?? "").split(" ");
  const phone = scheme === "Bearer" && token ? verifyPhoneToken(token) : null;
  if (!phone) {
    return next(
      new AppError(401, "মোবাইল নাম্বার যাচাই করা হয়নি বা যাচাইয়ের মেয়াদ শেষ হয়েছে। আবার কোড নিয়ে যাচাই করুন।", "PHONE_NOT_VERIFIED"),
    );
  }
  req.verifiedPhone = phone;
  next();
}
