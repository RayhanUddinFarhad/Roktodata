import fs from "node:fs";
import mongoose from "mongoose";
import { BLOOD_GROUPS, DISTRICTS, REQUEST_FEED_DAYS } from "../config/constants.js";
import { thanasOf } from "../config/locations.js";
import { PatientRequest } from "../models/PatientRequest.js";
import { dhakaDay } from "./dhakaDate.js";
import { findDonors } from "./findDonors.js";

// The AI assistant's tools. Everything with a right answer (dates, compatibility, who is listed) is
// worked out here in code, never guessed by the model. Each tool returns `result` for the model and,
// optionally, a `card` sent straight to the visitor's screen. Phone numbers only ever go in cards, so
// they never pass through the model.

// The "জানুন" articles as plain text (scripts/export-learn-articles.mjs).
const ARTICLES = JSON.parse(fs.readFileSync(new URL("../config/learnArticles.json", import.meta.url), "utf8"));

const DAY = 24 * 60 * 60 * 1000;
const DONOR_CARD_SIZE = 5;
const REQUEST_CARD_SIZE = 4;

// Who can receive from whom (red cells): RECEIVES_FROM[x] = groups x can be given.
const RECEIVES_FROM = {
  "O-": ["O-"],
  "O+": ["O+", "O-"],
  "A-": ["A-", "O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "AB+": [...BLOOD_GROUPS],
};

export const ARTICLE_LIST = ARTICLES.map((a) => `- ${a.slug}: ${a.title}`).join("\n");

const object = (properties, required) => ({ type: "object", properties, required, additionalProperties: false });
const bloodGroup = { type: "string", enum: BLOOD_GROUPS, description: "রক্তের গ্রুপ, যেমন \"B+\"" };

export const TOOL_DECLARATIONS = [
  {
    name: "search_donors",
    description:
      "Search the Roktodata donor list for donors who can give blood now. Use when someone needs blood or asks for donors. The donor cards (names, phones, call buttons) are shown to the visitor automatically; you only get counts.",
    parametersJsonSchema: object(
      {
        bloodGroup,
        district: { type: "string", enum: DISTRICTS, description: "জেলা, বাংলায়" },
        upazila: { type: "string", description: "থানা / উপজেলা, বাংলায় (ঐচ্ছিক)" },
      },
      ["bloodGroup", "district"],
    ),
  },
  {
    name: "list_blood_requests",
    description: "Recent public blood requests on Roktodata (people who need blood). Use when a donor asks who needs blood. Cards are shown to the visitor automatically.",
    parametersJsonSchema: object({ bloodGroup, district: { type: "string", enum: DISTRICTS } }, []),
  },
  {
    name: "next_donation_date",
    description: "Work out when someone can give blood again from their last donation date. Always use this instead of calculating dates yourself.",
    parametersJsonSchema: object(
      {
        lastDonationDate: { type: "string", description: "শেষ রক্তদানের তারিখ, YYYY-MM-DD" },
        gapDays: { type: "integer", enum: [90, 120], description: "সাধারণত 90; মহিলাদের জন্য অনেক সময় 120 দিনের পরামর্শ দেওয়া হয়" },
      },
      ["lastDonationDate"],
    ),
  },
  {
    name: "blood_compatibility",
    description: "Which blood groups a person can receive red cells from, and which groups they can give to. Always use this for compatibility questions.",
    parametersJsonSchema: object({ bloodGroup }, ["bloodGroup"]),
  },
  {
    name: "read_article",
    description: "Read one of Roktodata's own health articles in full. Read the relevant one before answering any health or donation-rule question.",
    parametersJsonSchema: object({ slug: { type: "string", enum: ARTICLES.map((a) => a.slug) } }, ["slug"]),
  },
];

const fail = (message) => ({ result: { error: message } });

const handlers = {
  async search_donors({ bloodGroup, district, upazila }) {
    if (!BLOOD_GROUPS.includes(bloodGroup) || !DISTRICTS.includes(district)) return fail("invalid blood group or district");
    // A thana the model spelled differently from the site's list is dropped, so the district still gets searched.
    const thana = upazila && thanasOf(district).find((t) => t === upazila.normalize("NFC")) ? upazila.normalize("NFC") : undefined;
    let found = await findDonors({ bloodGroup, district, upazila: thana, limit: DONOR_CARD_SIZE });
    let wholeDistrict = !thana;
    if (thana && found.total === 0) {
      found = await findDonors({ bloodGroup, district, limit: DONOR_CARD_SIZE });
      wholeDistrict = true;
    }
    return {
      result: {
        donorsFound: found.total,
        shownToVisitor: found.donors.length,
        searchedArea: wholeDistrict ? district : `${thana}, ${district}`,
        ...(upazila && !thana && { note: `"${upazila}" is not in the site's thana list, so the whole district was searched` }),
        ...(thana && wholeDistrict && { note: `no donor in ${thana}; showing the rest of ${district}` }),
      },
      card: { type: "donors", bloodGroup, district, upazila: wholeDistrict ? "" : thana, total: found.total, donors: found.donors },
    };
  },

  async list_blood_requests({ bloodGroup, district }) {
    const filter = { status: "Approved", createdAt: mongoose.trusted({ $gte: new Date(Date.now() - REQUEST_FEED_DAYS * DAY) }) };
    if (BLOOD_GROUPS.includes(bloodGroup)) filter.requiredBloodGroup = bloodGroup;
    if (DISTRICTS.includes(district)) filter.district = district;
    const requests = await PatientRequest.find(filter).sort({ createdAt: -1 }).limit(REQUEST_CARD_SIZE).lean();
    const cards = requests.map((r) => ({
      id: r._id.toString(),
      bloodGroup: r.requiredBloodGroup,
      bags: r.bagsNeeded ?? 1,
      district: r.district,
      upazila: r.upazila ?? "",
      hospital: r.hospitalAddress ?? "",
      neededDate: r.neededDate ? r.neededDate.toISOString().slice(0, 10) : null,
      phone: r.requesterPhone,
    }));
    return {
      result: { requestsFound: cards.length, requests: cards.map(({ phone: _phone, id: _id, ...rest }) => rest) },
      card: { type: "requests", requests: cards },
    };
  },

  async next_donation_date({ lastDonationDate, gapDays = 90 }) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastDonationDate ?? "")) return fail("date must be YYYY-MM-DD");
    const last = new Date(`${lastDonationDate}T00:00:00Z`);
    const today = new Date(`${dhakaDay()}T00:00:00Z`);
    if (Number.isNaN(last.getTime())) return fail("invalid date");
    if (last > today) return fail("the last donation date is in the future");
    const gap = gapDays === 120 ? 120 : 90;
    const next = new Date(last.getTime() + gap * DAY);
    const daysLeft = Math.max(0, Math.round((next - today) / DAY));
    return { result: { today: dhakaDay(), gapDays: gap, nextDate: next.toISOString().slice(0, 10), daysLeft, canDonateNow: daysLeft === 0 } };
  },

  async blood_compatibility({ bloodGroup }) {
    if (!BLOOD_GROUPS.includes(bloodGroup)) return fail("invalid blood group");
    const canGiveTo = BLOOD_GROUPS.filter((g) => RECEIVES_FROM[g].includes(bloodGroup));
    return {
      result: {
        bloodGroup,
        canReceiveFrom: RECEIVES_FROM[bloodGroup],
        canGiveTo,
        note: "Red cell compatibility. Plasma and platelets follow different rules; the hospital cross-matches before every transfusion.",
      },
    };
  },

  async read_article({ slug }) {
    const article = ARTICLES.find((a) => a.slug === slug);
    if (!article) return fail("unknown article");
    return { result: { link: `/learn/${article.slug}`, text: article.text } };
  },
};

// Runs one tool call from the model. Bad arguments come back as an error for the model to read,
// not as an exception.
export async function runTool(name, args = {}) {
  const handler = handlers[name];
  if (!handler) return fail(`unknown tool ${name}`);
  try {
    return await handler(args);
  } catch (err) {
    console.error(`assistant tool ${name} failed:`, err.message);
    return fail("the tool failed; tell the visitor to use the site's search instead");
  }
}
