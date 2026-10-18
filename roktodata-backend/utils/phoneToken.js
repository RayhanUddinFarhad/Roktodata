import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Proof that someone entered the SMS code for a phone number. Short-lived, and marked with its
// own purpose so it can never pass as an admin token (or the other way round).
const PURPOSE = "donor-phone";
export const PHONE_TOKEN_MINUTES = 15;

export function signPhoneToken(phoneNumber) {
  return jwt.sign({ purpose: PURPOSE, phone: phoneNumber }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: PHONE_TOKEN_MINUTES * 60,
  });
}

// Returns the verified phone number, or null if the token is missing, expired or not a phone token.
export function verifyPhoneToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    return payload.purpose === PURPOSE && typeof payload.phone === "string" ? payload.phone : null;
  } catch {
    return null;
  }
}
