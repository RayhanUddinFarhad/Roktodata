import { z } from "zod";
import {
  BD_PHONE_REGEX,
  BLOOD_GROUPS,
  COMPLAINT_REASONS,
  COMPLAINT_STATUS,
  DISTRICTS,
  DONOR_STATUS,
  REQUEST_STATUS,
} from "../config/constants.js";
import { dhakaDay, dhakaDayPlus } from "../utils/dhakaDate.js";

// Treat empty strings (e.g. "?district=") as "not provided".
const emptyToUndefined = (value) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const text = (label, max) =>
  z
    .string({ error: `${label} দিন।` })
    .trim()
    .min(1, `${label} দিন।`)
    .max(max, `${label} সর্বোচ্চ ${max} অক্ষরের হতে পারে।`);

const optionalText = (label, max) => z.preprocess(emptyToUndefined, text(label, max).optional());

const bloodGroup = z.enum(BLOOD_GROUPS, { error: "সঠিক রক্তের গ্রুপ নির্বাচন করুন।" });
const district = z.enum(DISTRICTS, { error: "সঠিক জেলা নির্বাচন করুন।" });

// Accepts 01712345678, +8801712345678 or 8801712345678 (spaces/dashes ignored); stores 01712345678.
const phone = (label) =>
  z
    .string({ error: `${label} দিন।` })
    .transform((value) => value.replace(/[\s-]/g, "").replace(/^\+?88(?=01)/, ""))
    .refine((value) => BD_PHONE_REGEX.test(value), `সঠিক ১১ ডিজিটের ${label} দিন (যেমন: 01712345678)।`);

const pastDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "তারিখ YYYY-MM-DD ফরম্যাটে দিন।")
  .transform((value) => new Date(`${value}T00:00:00.000Z`))
  .refine((date) => !Number.isNaN(date.getTime()), "সঠিক তারিখ দিন।")
  .refine((date) => date.getTime() <= Date.now(), "শেষ রক্তদানের তারিখ ভবিষ্যতের হতে পারবে না।");

export const registerDonorSchema = z.object({
  fullName: text("পূর্ণ নাম", 100),
  phoneNumber: phone("মোবাইল নাম্বার"),
  bloodGroup,
  district,
  upazila: text("থানা / উপজেলা", 60),
  lastDonationDate: z.preprocess(emptyToUndefined, pastDate.optional()),
  isReadyToDonate: z.boolean({ error: "রক্ত দিতে প্রস্তুত কিনা নির্বাচন করুন।" }),
});

export const searchDonorsSchema = z.object({
  bloodGroup: z.preprocess(emptyToUndefined, bloodGroup.optional()),
  district: z.preprocess(emptyToUndefined, district.optional()),
  upazila: optionalText("থানা / উপজেলা", 60),
});

export const patientSearchSchema = z.object({
  patientName: text("রোগীর নাম / কেস আইডি", 100),
  requiredBloodGroup: bloodGroup,
  district,
  upazila: optionalText("থানা / উপজেলা", 60),
  hospitalAddress: optionalText("হাসপাতালের ঠিকানা", 200),
  requesterPhone: phone("যোগাযোগের মোবাইল নাম্বার"),
  bagsNeeded: z.preprocess(
    emptyToUndefined,
    z
      .number({ error: "কত ব্যাগ রক্ত লাগবে তা সংখ্যায় দিন।" })
      .int("ব্যাগের সংখ্যা পূর্ণসংখ্যা হতে হবে।")
      .min(1, "কমপক্ষে ১ ব্যাগ দিন।")
      .max(10, "সর্বোচ্চ ১০ ব্যাগ দেওয়া যাবে।")
      .default(1),
  ),
  // Compared as "YYYY-MM-DD" strings against today's date in Bangladesh.
  neededDate: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "তারিখ YYYY-MM-DD ফরম্যাটে দিন।")
      .refine((day) => day >= dhakaDay(), "রক্তের প্রয়োজনের তারিখ আজ বা পরের কোনো দিন হতে হবে।")
      .refine((day) => day <= dhakaDayPlus(60), "রক্তের প্রয়োজনের তারিখ ৬০ দিনের মধ্যে দিন।")
      .transform((day) => new Date(`${day}T00:00:00.000Z`))
      .optional(),
  ),
});

const page = z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(1000).default(1));

export const requestFeedSchema = z.object({
  bloodGroup: z.preprocess(emptyToUndefined, bloodGroup.optional()),
  district: z.preprocess(emptyToUndefined, district.optional()),
  page,
});

const objectId = (label) => z.string().regex(/^[a-f\d]{24}$/i, `সঠিক ${label} দিন।`);

export const complaintSchema = z.object({
  donorId: objectId("ডোনার আইডি"),
  complainantPhone: phone("আপনার মোবাইল নাম্বার"),
  reason: z.enum(Object.keys(COMPLAINT_REASONS), { error: "অভিযোগের কারণ নির্বাচন করুন।" }),
  details: optionalText("বিস্তারিত", 500),
});

// ---- Admin ----

export const adminLoginSchema = z.object({
  username: z.string({ error: "ইউজারনেম দিন।" }).trim().min(1, "ইউজারনেম দিন।").max(100),
  password: z.string({ error: "পাসওয়ার্ড দিন।" }).min(1, "পাসওয়ার্ড দিন।").max(200),
});

export const idParamSchema = z.object({ id: objectId("আইডি") });

export const adminDonorListSchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(DONOR_STATUS).optional()),
  q: optionalText("খোঁজার শব্দ", 60),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(1000).default(1)),
});

export const donorStatusSchema = z.object({
  status: z.enum(DONOR_STATUS, { error: "সঠিক স্ট্যাটাস দিন।" }),
});

export const adminComplaintListSchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(COMPLAINT_STATUS).optional()),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(1000).default(1)),
});

export const complaintStatusSchema = z.object({
  status: z.enum(COMPLAINT_STATUS, { error: "সঠিক স্ট্যাটাস দিন।" }),
});

export const adminRequestListSchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(REQUEST_STATUS).optional()),
  page,
});

export const requestStatusSchema = z.object({
  status: z.enum(REQUEST_STATUS, { error: "সঠিক স্ট্যাটাস দিন।" }),
});
