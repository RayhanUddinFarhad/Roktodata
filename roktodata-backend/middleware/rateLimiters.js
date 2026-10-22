import { rateLimit } from "express-rate-limit";

function limiter(windowMinutes, limit, options = {}) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "অনেক বেশি অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
    ...options,
  });
}

// Applies to every /api route.
export const apiLimiter = limiter(15, 300);

// Writes are limited more tightly.
export const registerLimiter = limiter(60, 20);
// Each code costs an SMS; per-number limits live in otpController.
export const otpSendLimiter = limiter(60, 10);
// ...and at most this many a day from one IP, so nobody can keep texting listed numbers all day.
export const otpSendDailyLimiter = limiter(24 * 60, 15);
export const otpVerifyLimiter = limiter(15, 30);
export const patientSearchLimiter = limiter(15, 30);
// Call / WhatsApp tap counts; generous, since one person may try many donors.
export const contactLimiter = limiter(60, 120);
export const complaintLimiter = limiter(60, 10);
// Photo card serial reservations; generous because many mobile users share one IP address, but
// stops someone draining the numbers.
export const photocardLimiter = limiter(60, 120);
// Only reports that were actually saved count, so typos and validation errors don't lock people out.
export const fraudReportLimiter = limiter(60, 5, { skipFailedRequests: true });

// Only failed attempts count, to slow down password guessing.
export const adminLoginLimiter = limiter(15, 10, { skipSuccessfulRequests: true });
