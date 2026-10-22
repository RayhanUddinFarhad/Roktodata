import { z } from "zod";
import {
  BD_PHONE_REGEX,
  BLOOD_GROUPS,
  COMPLAINT_REASONS,
  COMPLAINT_STATUS,
  DISTRICTS,
  DONOR_STATUS,
  FRAUD_REASONS,
  FRAUD_STATUS,
  REQUEST_STATUS,
} from "../config/constants.js";
import { thanasOf } from "../config/locations.js";
import { APP_PLATFORMS } from "../models/AppInstall.js";
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

// Thana/upazila names are chosen from a per-district list (config/locations.js); NFC-normalised so
// differently encoded Bangla (e.g. "য়" as one or two code points) still matches.
const thana = z.string({ error: "থানা / উপজেলা নির্বাচন করুন।" }).trim().min(1, "থানা / উপজেলা নির্বাচন করুন।").max(60)
  .transform((value) => value.normalize("NFC"));
const optionalThana = z.preprocess(emptyToUndefined, thana.optional());

// Object-level check: the thana must belong to the chosen district.
const thanaInDistrict = (districtKey, thanaKey) => (data, ctx) => {
  const value = data[thanaKey];
  if (!value) return;
  if (!data[districtKey]) {
    ctx.addIssue({ code: "custom", path: [thanaKey], message: "থানা বেছে নিতে আগে জেলা নির্বাচন করুন।" });
  } else if (!thanasOf(data[districtKey]).includes(value)) {
    ctx.addIssue({ code: "custom", path: [thanaKey], message: "নির্বাচিত জেলার তালিকা থেকে সঠিক থানা / উপজেলা বেছে নিন।" });
  }
};

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
  upazila: thana,
  lastDonationDate: z.preprocess(emptyToUndefined, pastDate.optional()),
  isReadyToDonate: z.boolean({ error: "রক্ত দিতে প্রস্তুত কিনা নির্বাচন করুন।" }),
  // With "not ready": ready again by itself after 1/3/6 months, or "eligible" = once 90 days have
  // passed since the last donation (none = until changed).
  readyAgain: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal("eligible")]).nullish(),
  // This device's notification address, if it allowed notifications: links it to the donor for
  // the "you can donate again" reminder.
  pushEndpoint: z.preprocess(emptyToUndefined, z.string().max(1000).optional()),
}).superRefine(thanaInDistrict("district", "upazila"));

// A donor the admin adds by hand (approved straight away). Thana is optional for lists that lack it.
export const adminCreateDonorSchema = z.object({
  fullName: text("পূর্ণ নাম", 100),
  phoneNumber: phone("মোবাইল নাম্বার"),
  bloodGroup,
  district,
  upazila: optionalThana,
  lastDonationDate: z.preprocess(emptyToUndefined, pastDate.optional()),
  isReadyToDonate: z.boolean().default(true),
}).superRefine(thanaInDistrict("district", "upazila"));

export const searchDonorsSchema = z.object({
  bloodGroup: z.preprocess(emptyToUndefined, bloodGroup.optional()),
  district: z.preprocess(emptyToUndefined, district.optional()),
  upazila: optionalThana,
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(10000).default(1)),
}).superRefine(thanaInDistrict("district", "upazila"));

export const patientSearchSchema = z.object({
  patientName: text("রোগীর নাম / কেস আইডি", 100),
  requiredBloodGroup: bloodGroup,
  district,
  upazila: optionalThana,
  hospitalAddress: optionalText("হাসপাতালের ঠিকানা", 200),
  reason: optionalText("রোগ বা কারণ", 80),
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
}).superRefine(thanaInDistrict("district", "upazila"));

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
export const contactTypeSchema = z.object({ type: z.enum(["call", "whatsapp"], { error: "সঠিক ধরন দিন।" }) });

export const adminDonorListSchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(DONOR_STATUS).optional()),
  q: optionalText("খোঁজার শব্দ", 60),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(1000).default(1)),
  // "contacts": most call / WhatsApp taps first; otherwise newest first.
  sort: z.preprocess(emptyToUndefined, z.enum(["contacts"]).optional()),
  // "hidden": donors who chose "not ready", most recently hidden first ("oldest" turns that round).
  ready: z.preprocess(emptyToUndefined, z.enum(["hidden"]).optional()),
  order: z.preprocess(emptyToUndefined, z.enum(["oldest"]).optional()),
});

// Blocking needs a reason: it is shown publicly in the fraud list.
export const donorStatusSchema = z
  .object({
    status: z.enum(DONOR_STATUS, { error: "সঠিক স্ট্যাটাস দিন।" }),
    reason: optionalText("ব্লক করার কারণ", 300),
  })
  .refine((data) => data.status !== "Blocked" || data.reason, {
    message: "ব্লক করার কারণ লিখুন। কারণটি প্রতারক তালিকায় দেখানো হবে।",
    path: ["reason"],
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

// An empty note clears it.
const adminNote = z
  .string({ error: "নোট লিখুন।" })
  .trim()
  .max(300, "নোট সর্বোচ্চ ৩০০ অক্ষরের হতে পারে।");

export const requestStatusSchema = z.object({
  status: z.enum(REQUEST_STATUS, { error: "সঠিক স্ট্যাটাস দিন।" }),
  note: adminNote.optional(),
});

export const requestNoteSchema = z.object({ note: adminNote });

// ---- Fraud reports ----

export const fraudReportSchema = z
  .object({
    phoneNumber: phone("প্রতারকের মোবাইল নাম্বার"),
    name: text("প্রতারকের নাম", 100),
    reason: z.enum(Object.keys(FRAUD_REASONS), { error: "প্রতারণার ধরন নির্বাচন করুন।" }),
    details: z
      .string({ error: "কীভাবে প্রতারণা করেছেন তা লিখুন।" })
      .trim()
      .min(10, "কীভাবে প্রতারণা করেছেন তা একটু বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)।")
      .max(1000, "বিস্তারিত সর্বোচ্চ ১০০০ অক্ষরের হতে পারে।"),
    reporterPhone: phone("আপনার মোবাইল নাম্বার"),
  })
  .refine((data) => data.phoneNumber !== data.reporterPhone, {
    path: ["reporterPhone"],
    message: "নিজের নাম্বারের বিরুদ্ধে রিপোর্ট করা যাবে না।",
  });

export const fraudListSchema = z.object({ page });

export const namePreviewSchema = z.object({ name: text("নাম", 100) });

// Photo card serials: a reservation is the number plus the token the browser got with it.
const serialNumber = z.number().int().positive();
const serialToken = z.string().regex(/^[a-f0-9]{32}$/, "সঠিক টোকেন দিন।");
export const serialReserveSchema = z.object({ serial: serialNumber.optional(), token: serialToken.optional() });
export const serialConfirmSchema = z.object({ serial: serialNumber, token: serialToken });

export const otpSendSchema = z.object({ phoneNumber: phone("মোবাইল নাম্বার") });

export const otpVerifySchema = z.object({
  phoneNumber: phone("মোবাইল নাম্বার"),
  code: z.string({ error: "ভেরিফিকেশন কোড দিন।" }).trim().regex(/^\d{6}$/, "৬ ডিজিটের ভেরিফিকেশন কোড দিন।"),
});

export const fraudCheckSchema =z.object({ phone: phone("মোবাইল নাম্বার") });

export const adminFraudListSchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(FRAUD_STATUS).optional()),
  page,
});

export const fraudStatusSchema = z.object({
  status: z.enum(FRAUD_STATUS, { error: "সঠিক স্ট্যাটাস দিন।" }),
});

// Show (true) or hide (false) a blocked donor in the public fraud list.
export const fraudListingSchema = z.object({
  listed: z.boolean({ error: "প্রতারক তালিকায় দেখানো হবে কিনা জানান।" }),
});

// Browser push services only, so the server never posts to an arbitrary address.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];
const pushEndpoint = z
  .string()
  .max(1000)
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && PUSH_HOSTS.some((host) => host.test(url.hostname));
  }, "Unsupported push service.");

export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: pushEndpoint,
    keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
  }),
  // Approximate location from the visitor's IP address (sent by the website).
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  // A district the visitor picked; overrides the IP location.
  district: z.preprocess(emptyToUndefined, district.optional()),
});

export const pushUnsubscribeSchema = z.object({ endpoint: z.string().max(1000) });

// A notification the admin sends to everyone, or to one district and the area around it.
export const adminPushSchema = z.object({
  title: text("শিরোনাম", 60),
  body: text("বার্তা", 200),
  url: z.preprocess(emptyToUndefined, z.string().trim().max(200).regex(/^\/(?!\/)/,"লিংক / দিয়ে শুরু হতে হবে, যেমন /learn").optional()),
  district: z.preprocess(emptyToUndefined, district.optional()),
});

// A device that installed the app: its random id on the site, and what kind of device it is.
export const appInstallSchema = z.object({
  device: z.string().regex(/^[A-Za-z0-9-]{16,64}$/),
  platform: z.enum(APP_PLATFORMS).default("other"),
});
