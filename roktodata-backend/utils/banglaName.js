import fs from "node:fs";

// English-to-Bangla spellings of common Bangladeshi name words (lowercase keys), collected from
// the imported donor lists. Words not in it are spelt phonetically (see phonetic()).
const TOKENS = new Map(
  Object.entries(JSON.parse(fs.readFileSync(new URL("../config/nameTokens.json", import.meta.url), "utf8"))),
);

const LETTERS = {
  a: "এ", b: "বি", c: "সি", d: "ডি", e: "ই", f: "এফ", g: "জি", h: "এইচ", i: "আই", j: "জে", k: "কে", l: "এল", m: "এম",
  n: "এন", o: "ও", p: "পি", q: "কিউ", r: "আর", s: "এস", t: "টি", u: "ইউ", v: "ভি", w: "ডব্লিউ", x: "এক্স", y: "ওয়াই", z: "জেড",
};

// ---- phonetic fallback -------------------------------------------------------------------
// Longest match first. Consonants map to a letter; vowels have an independent form (word start
// or after another vowel) and a sign form (after a consonant).
const CONSONANTS = [
  ["chh", "ছ"], ["kh", "খ"], ["gh", "ঘ"], ["ch", "চ"], ["jh", "ঝ"], ["th", "থ"], ["dh", "ধ"], ["ph", "ফ"], ["bh", "ভ"],
  ["sh", "শ"], ["rh", "ঢ়"], ["ng", "ং"], ["k", "ক"], ["q", "ক"], ["c", "ক"], ["g", "গ"], ["j", "জ"], ["z", "জ"],
  ["t", "ত"], ["d", "দ"], ["n", "ন"], ["p", "প"], ["f", "ফ"], ["b", "ব"], ["v", "ভ"], ["m", "ম"], ["r", "র"], ["l", "ল"],
  ["s", "স"], ["h", "হ"], ["x", "ক্স"],
];
const VOWELS = [
  ["aa", "আ", "া"], ["ee", "ঈ", "ী"], ["oo", "উ", "ু"], ["ou", "ঔ", "ৌ"], ["ow", "ঔ", "ৌ"], ["oi", "ঐ", "ৈ"],
  ["a", "আ", "া"], ["i", "ই", "ি"], ["u", "উ", "ু"], ["e", "এ", "ে"],
  // "o" after a consonant is the inherent vowel ("Robin" -> রবিন).
  ["o", "ও", ""],
];
// Doubled consonants that form a conjunct ("Sabbir" -> সাব্বির, "Ullah" -> উল্লাহ); "ss" stays single.
const CONJUNCT_DOUBLES = new Set(["b", "d", "j", "k", "l", "m", "n", "p", "t"]);
const HASANT = "্";

function phonetic(word) {
  let out = "";
  let prev = "start"; // what the previous letter was: "start" | "vowel" | "consonant"
  let i = 0;
  const at = (list, pos) => list.find(([latin]) => word.startsWith(latin, pos));
  while (i < word.length) {
    const ch = word[i];
    if (ch === "w" || ch === "y") {
      if (at(VOWELS, i + 1)) {
        // Glides into the next vowel: "Waleed" -> ওয়ালীদ, "Riyad" -> রিয়াদ, "Swapan" -> স্বাপান.
        if (ch === "w") out += prev === "consonant" ? HASANT + "ব" : "ওয়";
        else out += prev === "start" ? "ইয়" : "য়";
        prev = "consonant";
      } else {
        // Otherwise "y" after a consonant sounds like "i" ("Rony" -> রনি), after a vowel it is য়
        // ("Aysha" -> আয়শা, "Joy" -> জয়); "w" sounds like "o".
        if (ch === "y") out += prev === "consonant" ? "ি" : prev === "vowel" ? "য়" : "ই";
        else out += prev === "consonant" ? "ো" : "ও";
        prev = ch === "y" && prev === "vowel" ? "consonant" : "vowel";
      }
      i += 1;
      continue;
    }
    const vowel = at(VOWELS, i);
    if (vowel) {
      const [latin, independent, sign] = vowel;
      // a/e/o right after another vowel take a য় glide: "Zubaer" -> জুবায়ের, "Riaz" -> রিয়াজ.
      if (prev === "vowel" && /^[aeo]/.test(latin)) out += "য়" + (sign || "");
      else out += prev === "consonant" ? sign : independent;
      prev = "vowel";
      i += latin.length;
      continue;
    }
    const consonant = at(CONSONANTS, i);
    if (consonant) {
      const [latin, bangla] = consonant;
      if (latin.length === 1 && word[i + 1] === ch) {
        // Doubled letter: a conjunct, or just one letter ("ss").
        out += CONJUNCT_DOUBLES.has(ch) ? bangla + HASANT + bangla : bangla;
        i += 2;
      } else {
        // "ng" before a vowel is ঙ্গ ("Tangail"), otherwise ং ("Bangla").
        out += latin === "ng" && at(VOWELS, i + 2) ? "ঙ্গ" : bangla;
        i += latin.length;
        // A word-initial consonant followed by r/l forms a conjunct: "Prova" -> প্রভা, "Biplob" stays বিপলব.
        if (prev === "start" && (word[i] === "r" || word[i] === "l") && latin !== "ng") {
          out += HASANT + (word[i] === "r" ? "র" : "ল");
          i += 1;
        }
      }
      prev = "consonant";
      continue;
    }
    i += 1; // anything else is dropped
  }
  return out;
}

// ---- names -------------------------------------------------------------------------------
const hasLatin = (s) => /[A-Za-z]/.test(s);

function word(raw) {
  const lower = raw.toLowerCase();
  const known = TOKENS.get(lower);
  if (known) return known;
  // Short all-caps words without a known spelling are initials: "AK" -> এ.কে.
  if (/^[A-Z]{1,3}$/.test(raw) && !/[AEIOU]/.test(raw.slice(1))) return [...lower].map((c) => LETTERS[c]).join(".") + ".";
  return phonetic(lower);
}

// Converts the English (Latin) parts of a name to Bangla; Bangla parts are kept as typed.
// "MD. Rakib Hasan" -> "মোঃ রাকিব হাসান", "A.K.M. Shamim" -> "এ.কে.এম. শামীম".
export function toBanglaName(name) {
  const trimmed = name.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!hasLatin(trimmed)) return trimmed;

  const parts = [];
  // Dotted initials ("A.K.M.", "S. M."), then words; other punctuation separates words.
  const pieces = trimmed.match(/(?:[A-Za-z]\.\s?){2,}|[A-Za-z]+|[ঀ-৿]+|[()\-]/g) ?? [];
  for (const piece of pieces) {
    if (/^[ঀ-৿]+$/.test(piece) || /^[()\-]$/.test(piece)) parts.push(piece);
    else if (/\./.test(piece)) parts.push(piece.replace(/[\s.]/g, "").toLowerCase().split("").map((c) => LETTERS[c]).join(".") + ".");
    else parts.push(word(piece));
  }
  return parts
    .join(" ")
    .replace(/\(\s/g, "(")
    .replace(/\s\)/g, ")")
    .replace(/\s-\s/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}
