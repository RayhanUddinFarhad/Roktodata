import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // When "false", donors can register/update with just a phone number (no Firebase SMS login).
  REQUIRE_PHONE_VERIFICATION: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  // Admin panel login (single admin account).
  ADMIN_USERNAME: z.string().trim().min(3, "ADMIN_USERNAME must be at least 3 characters"),
  ADMIN_PASSWORD: z.string().min(10, "ADMIN_PASSWORD must be at least 10 characters"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
