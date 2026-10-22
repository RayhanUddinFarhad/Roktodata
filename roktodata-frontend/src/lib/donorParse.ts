// Reads donor details out of text an admin pastes (a message, a post, a list): name, blood group,
// phone, last donation date, district and thana, in Bangla or English, Bangla or English digits.
// Several donors can be pasted at once, separated by a blank line. The result is a draft the admin
// checks before saving; anything that couldn't be read is listed in `missing`.
import { BLOOD_GROUPS, DISTRICTS, type BloodGroup } from "@/lib/data";
import { thanasOf } from "@/lib/locations";

export interface DonorDraft {
  fullName: string;
  phoneNumber: string;
  bloodGroup: BloodGroup | "";
  district: string;
  upazila: string;
  lastDonationDate: string; // YYYY-MM-DD or ""
  isReadyToDonate: boolean;
  missing: string[];
}

export const emptyDraft = (): DonorDraft => ({
  fullName: "",
  phoneNumber: "",
  bloodGroup: "",
  district: "",
  upazila: "",
  lastDonationDate: "",
  isReadyToDonate: true,
  missing: [],
});

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toEnglishDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

// For matching place names: spelling variants that are often mixed up count as the same.
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ী/g, "ি")
    .replace(/ূ/g, "ু")
    .replace(/ড়/g, "ড়")
    .replace(/য়/g, "য়")
    .replace(/[\s.,।ঃ:'"()-]/g, "");

const MONTHS: [RegExp, number][] = [
  [/^(জানু(য়|য়)ার(ি|ী)|jan)/i, 1],
  [/^(ফেব্রু(য়|য়)ার(ি|ী)|feb)/i, 2],
  [/^(মার্চ|mar)/i, 3],
  [/^(এপ্রিল|apr)/i, 4],
  [/^(মে|may)/i, 5],
  [/^(জুন|jun)/i, 6],
  [/^(জুলাই|jul)/i, 7],
  [/^(আগস্ট|অগাস্ট|aug)/i, 8],
  [/^(সেপ্টেম্বর|sep)/i, 9],
  [/^(অক্টোবর|oct)/i, 10],
  [/^(নভেম্বর|nov)/i, 11],
  [/^(ডিসেম্বর|dec)/i, 12],
];
const monthOf = (word: string) => MONTHS.find(([re]) => re.test(word))?.[1] ?? 0;
const MONTH_WORD = "([a-z]{3,9}|[\\u0980-\\u09ff]{2,12})";

const pad = (n: number) => String(n).padStart(2, "0");
// A real calendar date that is not in the future, as YYYY-MM-DD; otherwise "".
function validDate(y: number, m: number, d: number) {
  if (y < 100) y += 2000;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (!m || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return "";
  if (date.getTime() > Date.now() || y < 1980) return "";
  return `${y}-${pad(m)}-${pad(d)}`;
}

function findDate(text: string) {
  const t = toEnglishDigits(text);
  let m = t.match(new RegExp(`(\\d{1,2})\\s*(?:st|nd|rd|th)?[\\s,./-]*${MONTH_WORD}[\\s,./-]*(\\d{2,4})`, "i"));
  if (m && monthOf(m[2])) return validDate(+m[3], monthOf(m[2]), +m[1]);
  m = t.match(new RegExp(`${MONTH_WORD}[\\s,./-]*(\\d{1,2})(?:st|nd|rd|th)?[\\s,./-]+(\\d{4})`, "i"));
  if (m && monthOf(m[1])) return validDate(+m[3], monthOf(m[1]), +m[2]);
  m = t.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return validDate(+m[1], +m[2], +m[3]);
  m = t.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) return validDate(+m[3], +m[2], +m[1]);
  return "";
}

function findPhone(text: string) {
  const t = toEnglishDigits(text).replace(/[\s-]/g, "");
  return t.match(/(?:\+?88)?(01[3-9]\d{8})(?!\d)/)?.[1] ?? "";
}

const GROUP_RE = /(এবি|বি|এ|ও|AB|A|B|O)\s*(\+|-|−|–|পজিটিভ|পজেটিভ|পজিটিব|নেগেটিভ|নেগেটিব|positive|negative|pos|neg|\(\+\)|\(-\))/i;
function findGroup(text: string): BloodGroup | "" {
  for (const line of text.split("\n")) {
    const m = line.match(GROUP_RE);
    if (!m) continue;
    const letter = ({ এবি: "AB", বি: "B", এ: "A", ও: "O" } as Record<string, string>)[m[1]] ?? m[1].toUpperCase();
    const negative = /^(-|−|–|নেগেটিভ|নেগেটিব|negative|neg|\(-\))$/i.test(m[2]);
    const group = `${letter}${negative ? "-" : "+"}`;
    if ((BLOOD_GROUPS as readonly string[]).includes(group)) return group as BloodGroup;
  }
  return "";
}

const LOCATION_LABEL = /(লোকেশন|ঠিকানা|এলাকা|location|address|থানা|উপজেলা|জেলা)\s*[:ঃ-]?/i;

// District and thana: from a "লোকেশন: থানা, জেলা" line when there is one, else from anywhere in the
// text; a thana that belongs to only one district also gives the district.
function findPlace(text: string) {
  const labelled = text.split("\n").find((l) => LOCATION_LABEL.test(l));
  const source = labelled ? labelled.replace(LOCATION_LABEL, " ") : text;
  const parts = source.split(/[,،/|\n]+/).map((p) => p.trim()).filter(Boolean);
  const all = norm(source);

  let district = DISTRICTS.find((d) => parts.some((p) => norm(p) === norm(d))) ?? DISTRICTS.find((d) => all.includes(norm(d))) ?? "";
  const thanaIn = (d: string) =>
    thanasOf(d).find((t) => parts.some((p) => norm(p) === norm(t))) ?? thanasOf(d).find((t) => norm(t).length > 2 && all.includes(norm(t)));

  if (district) return { district, upazila: thanaIn(district) ?? "" };
  const matches = DISTRICTS.flatMap((d) => {
    const t = thanaIn(d);
    return t ? [{ district: d, upazila: t }] : [];
  });
  if (matches.length === 1) return matches[0];
  district = "";
  return { district, upazila: "" };
}

const NAME_LABEL = /^(নাম|name)\s*[:ঃ-]\s*/i;
function findName(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const labelled = lines.find((l) => NAME_LABEL.test(l));
  if (labelled) return labelled.replace(NAME_LABEL, "").trim();
  const looksLikeName = (l: string) =>
    l.length >= 3 &&
    l.length <= 60 &&
    !/[\d০-৯]/.test(l) &&
    !GROUP_RE.test(l) &&
    !LOCATION_LABEL.test(l) &&
    !/(রক্ত|ডোনেট|ডোনার|blood|donat|গ্রুপ|group)/i.test(l);
  const clean = (l: string) => l.replace(/^[\d০-৯]+[.)]\s*|^[-•*]\s*/, "").trim();
  // a line of its own, or else the first comma-separated part that isn't a place ("নাম, গ্রুপ, থানা, …")
  const isPlace = (p: string) => DISTRICTS.some((d) => norm(d) === norm(p) || thanasOf(d).some((t) => norm(t) === norm(p)));
  return (
    lines.map(clean).find(looksLikeName) ??
    lines.flatMap((l) => l.split(/[,،]/)).map(clean).find((p) => looksLikeName(p) && !isPlace(p)) ??
    ""
  );
}

export function parseDonor(text: string): DonorDraft {
  const { district, upazila } = findPlace(text);
  const draft: DonorDraft = {
    fullName: findName(text),
    phoneNumber: findPhone(text),
    bloodGroup: findGroup(text),
    district,
    upazila,
    lastDonationDate: findDate(text),
    isReadyToDonate: true,
    missing: [],
  };
  draft.missing = [
    !draft.fullName && "নাম",
    !draft.phoneNumber && "মোবাইল নাম্বার",
    !draft.bloodGroup && "রক্তের গ্রুপ",
    !draft.district && "জেলা",
  ].filter(Boolean) as string[];
  return draft;
}

// Splits pasted text into one block per donor (blank lines between donors); a block with neither a
// phone number nor a blood group belongs to the donor before it.
export function parseDonors(text: string): DonorDraft[] {
  const blocks: string[] = [];
  for (const block of text.replace(/\r/g, "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)) {
    if (blocks.length && !findPhone(block) && !findGroup(block)) blocks[blocks.length - 1] += `\n${block}`;
    else blocks.push(block);
  }
  return blocks.map(parseDonor);
}
