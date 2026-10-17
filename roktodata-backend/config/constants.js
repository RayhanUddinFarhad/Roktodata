export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// New donors are "Pending" until an admin approves them; only "Active" donors are public.
export const DONOR_STATUS = ["Pending", "Active", "Blocked"];

export const COMPLAINT_STATUS = ["Open", "Resolved", "Dismissed"];

// Patient blood requests are "Pending" until an admin approves them for the public feed.
export const REQUEST_STATUS = ["Pending", "Approved", "Rejected", "Fulfilled"];

// The public feed shows approved requests from the last this-many days.
export const REQUEST_FEED_DAYS = 30;

// Requests and "one request per number per day" use Bangladesh time.
export const TIME_ZONE = "Asia/Dhaka";

export const COMPLAINT_REASONS = {
  wrong_number: "ভুল নাম্বার / নাম্বার বন্ধ",
  not_responding: "যোগাযোগে সাড়া দেন না",
  asked_money: "টাকা দাবি করেছেন",
  misbehavior: "খারাপ ব্যবহার",
  false_info: "ভুল তথ্য দেওয়া",
  other: "অন্যান্য",
};

// A donor can give blood again once this many days have passed since their last donation.
export const ELIGIBILITY_DAYS = 90;

export const MAX_SEARCH_RESULTS = 100;

// Bangladesh mobile numbers in local 11-digit format, e.g. 01712345678.
export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

// Must stay in sync with DISTRICTS in the frontend (src/lib/data.ts).
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
