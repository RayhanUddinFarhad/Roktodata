import crypto from "node:crypto";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Donor } from "../models/Donor.js";
import { OtpCode } from "../models/OtpCode.js";
import { AppError } from "../utils/AppError.js";
import { PHONE_TOKEN_MINUTES, signPhoneToken } from "../utils/phoneToken.js";
import { sendSms } from "../utils/sms.js";

const CODE_MINUTES = 5;
const RESEND_SECONDS = 60;
// Kept low so nobody can pester a donor (anyone can type a listed number) or run up the SMS bill.
const MAX_PER_NUMBER_PER_DAY = 3;
const MAX_ATTEMPTS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const hashCode = (phoneNumber, code) =>
  crypto.createHmac("sha256", env.JWT_SECRET).update(`${phoneNumber}:${code}`).digest("hex");

const sameHash = (a, b) => crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));

// Bangla digits for numbers inside messages.
const bn = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

const since = (ms) => mongoose.trusted({ $gte: new Date(Date.now() - ms) });

// POST /api/otp/send
export async function sendOtp(req, res) {
  const { phoneNumber } = req.validated;

  // Saving would fail for a blocked profile anyway, so don't spend an SMS on it.
  if (await Donor.exists({ phoneNumber, status: "Blocked" })) {
    throw new AppError(403, "এই প্রোফাইলটি ব্লক করা হয়েছে। বিস্তারিত জানতে Roktodatainfo@gmail.com-এ ইমেইল করুন।");
  }

  const last = await OtpCode.findOne({ phoneNumber }).sort({ createdAt: -1 }).lean();
  const waitSeconds = last ? Math.ceil((last.createdAt.getTime() + RESEND_SECONDS * 1000 - Date.now()) / 1000) : 0;
  if (waitSeconds > 0) {
    throw new AppError(429, `নতুন কোড পেতে ${bn(waitSeconds)} সেকেন্ড অপেক্ষা করুন।`, "OTP_COOLDOWN");
  }
  if ((await OtpCode.countDocuments({ phoneNumber, createdAt: since(DAY_MS) })) >= MAX_PER_NUMBER_PER_DAY) {
    throw new AppError(429, "এই নাম্বারে আজ অনেকবার কোড পাঠানো হয়েছে। ২৪ ঘণ্টা পর আবার চেষ্টা করুন।", "OTP_DAILY_LIMIT");
  }
  if ((await OtpCode.countDocuments({ createdAt: since(DAY_MS) })) >= env.OTP_DAILY_LIMIT) {
    console.warn(`OTP_DAILY_LIMIT (${env.OTP_DAILY_LIMIT}) reached; verification SMS paused.`);
    throw new AppError(503, "এই মুহূর্তে কোড পাঠানো যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।", "OTP_UNAVAILABLE");
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  // Saved before sending; removed again if the SMS fails so it does not count toward the limits.
  const otp = await OtpCode.create({
    phoneNumber,
    codeHash: hashCode(phoneNumber, code),
    expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000),
  });

  try {
    await sendSms(phoneNumber, `Your Roktodata verification code is ${code}. Valid for ${CODE_MINUTES} minutes. Do not share it with anyone. Ignore this if you did not request it.`);
  } catch (err) {
    await OtpCode.deleteOne({ _id: otp._id });
    console.error("Verification SMS failed:", err.message);
    throw new AppError(502, "SMS পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।", "SMS_FAILED");
  }

  res.json({
    success: true,
    message: `+88${phoneNumber} নাম্বারে ৬ ডিজিটের কোড পাঠানো হয়েছে।`,
    expiresInSeconds: CODE_MINUTES * 60,
    resendInSeconds: RESEND_SECONDS,
  });
}

// POST /api/otp/verify — only the latest code sent to the number counts.
export async function verifyOtp(req, res) {
  const { phoneNumber, code } = req.validated;
  const expired = new AppError(400, "কোডের মেয়াদ শেষ হয়ে গেছে। আবার কোড পাঠান।", "OTP_EXPIRED");

  const otp = await OtpCode.findOne({ phoneNumber }).sort({ createdAt: -1 });
  if (!otp || otp.usedAt || otp.expiresAt.getTime() < Date.now()) throw expired;
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new AppError(400, "অনেকবার ভুল কোড দেওয়া হয়েছে। আবার কোড পাঠান।", "OTP_LOCKED");
  }

  if (!sameHash(otp.codeHash, hashCode(phoneNumber, code))) {
    // Counted atomically so parallel guesses can't exceed MAX_ATTEMPTS.
    const updated = await OtpCode.findOneAndUpdate(
      { _id: otp._id, attempts: mongoose.trusted({ $lt: MAX_ATTEMPTS }) },
      { $inc: { attempts: 1 } },
      { new: true },
    );
    const left = updated ? MAX_ATTEMPTS - updated.attempts : 0;
    throw new AppError(
      400,
      left > 0 ? `কোডটি সঠিক নয়। আর ${bn(left)} বার চেষ্টা করতে পারবেন।` : "অনেকবার ভুল কোড দেওয়া হয়েছে। আবার কোড পাঠান।",
      left > 0 ? "OTP_INVALID" : "OTP_LOCKED",
    );
  }

  // Each code works once.
  const claimed = await OtpCode.updateOne({ _id: otp._id, usedAt: null }, { $set: { usedAt: new Date() } });
  if (claimed.modifiedCount !== 1) throw expired;

  res.json({
    success: true,
    message: "মোবাইল নাম্বার যাচাই হয়েছে।",
    verificationToken: signPhoneToken(phoneNumber),
    expiresInSeconds: PHONE_TOKEN_MINUTES * 60,
  });
}
