import { isProduction } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function notFound(req, _res, next) {
  next(new AppError(404, `পাওয়া যায়নি: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by their 4 arguments
export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode ?? 500;
  let message = err instanceof AppError ? err.message : "সার্ভারে একটি সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।";

  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "অনুরোধের ডেটা সঠিক JSON নয়।";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "অনুরোধের ডেটা অনেক বড়।";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "প্রদত্ত তথ্য সঠিক নয়।";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "এই তথ্য দিয়ে ইতিমধ্যে একটি রেকর্ড আছে।";
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(err instanceof AppError && err.code && { code: err.code }),
    ...(!isProduction && statusCode >= 500 && { error: err.message }),
  });
}
