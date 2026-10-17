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
export const patientSearchLimiter = limiter(15, 30);
export const complaintLimiter = limiter(60, 10);
// Only reports that were actually saved count, so typos and validation errors don't lock people out.
export const fraudReportLimiter = limiter(60, 5, { skipFailedRequests: true });

// Only failed attempts count, to slow down password guessing.
export const adminLoginLimiter = limiter(15, 10, { skipSuccessfulRequests: true });
