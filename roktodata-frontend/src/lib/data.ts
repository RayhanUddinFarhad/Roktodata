export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

// A donor as returned by the API's search endpoints. Only approved donors who are
// ready to donate and last donated 90+ days ago (or never) are returned.
export interface Donor {
  id: string;
  fullName: string;
  phoneNumber: string;
  bloodGroup: BloodGroup;
  district: string;
  upazila: string;
  lastDonationDate: string | null;
}

export type DonorStatus = "Pending" | "Active" | "Blocked";
export type ComplaintStatus = "Open" | "Resolved" | "Dismissed";
export type RequestStatus = "Pending" | "Approved" | "Rejected" | "Fulfilled";

// A patient's blood request as shown in the public feed and the admin panel.
export interface BloodRequest {
  id: string;
  patientName: string;
  requiredBloodGroup: BloodGroup;
  district: string;
  upazila: string;
  hospitalAddress: string;
  // Optional illness or reason, e.g. "রক্তশূন্যতা" ("" when not given).
  reason: string;
  requesterPhone: string;
  bagsNeeded: number;
  neededDate: string | null;
  status: RequestStatus;
  // Admin's public update on the post, e.g. "রক্ত ম্যানেজ হয়েছে।" ("" when none).
  adminNote: string;
  createdAt: string;
}

// Shown when a donor's last donation date (or other detail) wasn't provided.
export const NOT_MENTIONED = "উল্লেখ নেই";

// "জেলা, থানা", or just the district when the thana is unknown (some imported donors).
export const formatLocation = (district: string, upazila?: string | null) =>
  upazila ? `${district}, ${upazila}` : district;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const toBanglaNumber = (value: number | string) =>
  String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);

// Must stay in sync with COMPLAINT_REASONS in the backend (config/constants.js).
export const COMPLAINT_REASONS = {
  wrong_number: "ভুল নাম্বার / নাম্বার বন্ধ",
  not_responding: "যোগাযোগে সাড়া দেন না",
  asked_money: "টাকা দাবি করেছেন",
  misbehavior: "খারাপ ব্যবহার",
  false_info: "ভুল তথ্য দেওয়া",
  other: "অন্যান্য",
} as const;

export type ComplaintReason = keyof typeof COMPLAINT_REASONS;

// Must stay in sync with FRAUD_REASONS in the backend (config/constants.js).
export const FRAUD_REASONS = {
  money_taken: "টাকা নিয়ে রক্ত দেননি",
  asked_money: "রক্তের বিনিময়ে টাকা দাবি করেছেন",
  fake_identity: "ভুয়া পরিচয় / ভুল রক্তের গ্রুপ",
  no_show: "কথা দিয়ে আসেননি / ফোন বন্ধ করে দিয়েছেন",
  harassment: "হয়রানি / খারাপ আচরণ",
  other: "অন্যান্য",
} as const;

export type FraudReason = keyof typeof FRAUD_REASONS;
export type FraudReportStatus = "Pending" | "Approved" | "Rejected";

// Feedback about Roktodata: who is writing (same keys as the backend).
export const FEEDBACK_ROLES = { patient: "রোগীর পক্ষ থেকে", donor: "রক্তদাতা হিসেবে" } as const;
export type FeedbackRole = keyof typeof FEEDBACK_ROLES;
export type FeedbackStatus = "Pending" | "Approved" | "Rejected";

// One approved feedback as shown on the site.
export interface Feedback {
  id: string;
  name: string;
  district: string;
  upazila: string;
  role: FeedbackRole;
  roleLabel: string;
  message: string;
  date: string;
}

// One fraudulent number in the public list: every admin-approved fraud report against it and,
// if it belongs to a donor the admin blocked, the block reason and complaint reasons.
export interface FraudEntry {
  phoneNumber: string;
  names: string[];
  reportCount: number;
  lastReportedAt: string;
  blockedDonor: boolean;
  reports: {
    // "report": fraud report, "admin": the admin's block reason, "complaint": a complaint (details stay private)
    source: "report" | "admin" | "complaint";
    reason: string;
    reasonLabel: string;
    details: string;
    createdAt: string;
  }[];
}

// Must stay in sync with DISTRICTS in the backend (config/constants.js).
export const DISTRICTS = [
  "ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "নরসিংদী", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "টাঙ্গাইল", "কিশোরগঞ্জ",
  "ফরিদপুর", "গোপালগঞ্জ", "মাদারীপুর", "রাজবাড়ী", "শরীয়তপুর",
  "চট্টগ্রাম", "কক্সবাজার", "রাঙ্গামাটি", "বান্দরবান", "খাগড়াছড়ি", "কুমিল্লা", "ব্রাহ্মণবাড়িয়া",
  "চাঁদপুর", "লক্ষ্মীপুর", "নোয়াখালী", "ফেনী",
  "রাজশাহী", "নাটোর", "নওগাঁ", "চাঁপাইনবাবগঞ্জ", "পাবনা", "সিরাজগঞ্জ", "বগুড়া", "জয়পুরহাট",
  "খুলনা", "যশোর", "সাতক্ষীরা", "বাগেরহাট", "নড়াইল", "মাগুরা", "ঝিনাইদহ", "কুষ্টিয়া",
  "চুয়াডাঙ্গা", "মেহেরপুর",
  "বরিশাল", "পটুয়াখালী", "ভোলা", "পিরোজপুর", "বরগুনা", "ঝালকাঠি",
  "সিলেট", "মৌলভীবাজার", "হবিগঞ্জ", "সুনামগঞ্জ",
  "রংপুর", "দিনাজপুর", "ঠাকুরগাঁও", "পঞ্চগড়", "নীলফামারী", "লালমনিরহাট", "কুড়িগ্রাম", "গাইবান্ধা",
  "ময়মনসিংহ", "জামালপুর", "শেরপুর", "নেত্রকোণা",
];

export const NAV_LINKS = [
  { href: "/", label: "হোম" },
  { href: "/find-donor", label: "ডোনার খুঁজুন" },
  { href: "/patient-search", label: "রোগীর তথ্য দিয়ে খুঁজুন" },
  { href: "/blood-requests", label: "রক্তের অনুরোধ" },
  { href: "/fraud-donors", label: "প্রতারক ডোনার" },
  { href: "/celebrate", label: "রক্তদান ফটোকার্ড" },
  { href: "/learn", label: "জানুন" },
  // The wide-screen bar is full; this one is in the ☰ menu and the footer.
  { href: "/feedback", label: "ফিডব্যাক", menuOnly: true },
  { href: "/about", label: "আমাদের সম্পর্কে" },
];

export const CONTACT_EMAIL = "roktodatainfo@gmail.com";

export const FACEBOOK_URL = "https://www.facebook.com/share/1Drs6xsScp/";

// Opens a WhatsApp chat with a Bangladeshi number (01XXXXXXXXX), with a message ready to send.
// WhatsApp itself tells the user if the number isn't on WhatsApp.
export const whatsappLink = (phone: string, message: string) =>
  `https://wa.me/88${phone.replace(/\D/g, "").replace(/^88/, "")}?text=${encodeURIComponent(message)}`;

export const donorWhatsAppMessage = (bloodGroup: string) =>
  `আসসালামু আলাইকুম। রক্তদাতা (roktodata.org) থেকে আপনার নাম্বার পেয়েছি। আমাদের ${bloodGroup} রক্ত প্রয়োজন। আপনি কি রক্ত দিতে পারবেন? সম্ভব হলে জানাবেন, ধন্যবাদ।`;

export const requestWhatsAppMessage = (bloodGroup: string) =>
  `আসসালামু আলাইকুম। রক্তদাতা (roktodata.org)-তে আপনার ${bloodGroup} রক্তের অনুরোধটি দেখেছি। আমি রক্ত দিতে আগ্রহী।`;

export const DEVELOPER_NAME = "NokshaByte";
export const DEVELOPER_URL = "https://www.nokshabyte.com";
