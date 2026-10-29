import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // When "false", donors can register/update with just a phone number (no SMS code).
  REQUIRE_PHONE_VERIFICATION: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  // Admin panel login (single admin account).
  ADMIN_USERNAME: z.string().trim().min(3, "ADMIN_USERNAME must be at least 3 characters"),
  ADMIN_PASSWORD: z.string().min(10, "ADMIN_PASSWORD must be at least 10 characters"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  // sms.net.bd (Alpha SMS) API key for donor verification codes. Outside production, codes are
  // printed in the server log while it is empty.
  SMS_NET_BD_API_KEY: z.string().trim().default(""),
  // Approved sender ID shown as the SMS sender; empty uses the account's default number.
  SMS_SENDER_ID: z.string().trim().default(""),
  // Site-wide cap on verification SMS in 24 hours, so abuse can't drain the SMS balance.
  OTP_DAILY_LIMIT: z.coerce.number().int().positive().default(300),
  // Shared secret for scheduled jobs (the daily "you can donate again" notification, run by GitHub Actions).
  // While empty, the job endpoints are switched off.
  // Web push (browser and app notifications). While the keys are empty, nothing is sent.
  VAPID_PUBLIC_KEY: z.string().trim().default(""),
  VAPID_PRIVATE_KEY: z.string().trim().default(""),
  VAPID_SUBJECT: z.string().trim().default("mailto:Roktodatainfo@gmail.com"),
  // Google Gemini for the AI assistant ("রক্তদাতা সহকারী"). While the key is empty, the assistant is off.
  // When the main model is out of quota (429), the fallback model answers instead.
  GEMINI_API_KEY: z.string().trim().default(""),
  // gemini-3.6-flash: quick on the free tier in testing (2026-10-29); 3.8 Flash kept timing out there.
  GEMINI_MODEL: z.string().trim().default("gemini-3.6-flash"),
  GEMINI_FALLBACK_MODEL: z.string().trim().default("gemini-3.5-flash-lite"),
  // Site-wide cap on assistant questions per Bangladesh day, to stay inside the free quota.
  ASSISTANT_DAILY_LIMIT: z.coerce.number().int().positive().default(500),
  // Questions one visitor (IP address) may ask per day.
  ASSISTANT_PER_VISITOR_LIMIT: z.coerce.number().int().positive().default(20),
  JOBS_SECRET: z.string().trim().refine((v) => v === "" || v.length >= 32, "JOBS_SECRET must be at least 32 characters").default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
