// Copies the "জানুন" articles from the frontend (src/lib/articles.ts) into config/learnArticles.json as
// plain text, for the AI assistant to read. Run again whenever the articles change:
//   node scripts/export-learn-articles.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = path.resolve(here, "../../roktodata-frontend/src/lib");
const out = path.resolve(here, "../config/learnArticles.json");

// Node runs the TypeScript directly (type stripping); only the "@/lib/data" alias needs a real path.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "learn-"));
fs.copyFileSync(path.join(lib, "data.ts"), path.join(tmp, "data.ts"));
fs.writeFileSync(path.join(tmp, "articles.ts"), fs.readFileSync(path.join(lib, "articles.ts"), "utf8").replace('"@/lib/data"', '"./data.ts"'));
const { ARTICLES } = await import(pathToFileURL(path.join(tmp, "articles.ts")).href);
fs.rmSync(tmp, { recursive: true, force: true });

const block = (b) =>
  b.p ??
  (b.list && b.list.map((item) => `- ${item}`).join("\n")) ??
  (b.steps && b.steps.map((item, i) => `${i + 1}. ${item}`).join("\n")) ??
  (b.note && `${b.note.title}: ${b.note.text}`) ??
  (b.table && [b.table.head, ...b.table.rows].map((row) => row.join(" | ")).join("\n")) ??
  "";

const articles = ARTICLES.map((a) => ({
  slug: a.slug,
  title: a.title,
  description: a.description,
  text: [
    `# ${a.title}`,
    `এক নজরে:\n${a.facts.map((f) => `- ${f}`).join("\n")}`,
    ...a.sections.map((s) => `## ${s.heading}\n${s.blocks.map(block).join("\n\n")}`),
    `## প্রশ্ন ও উত্তর\n${a.faq.map((f) => `প্রশ্ন: ${f.question}\nউত্তর: ${f.answer}`).join("\n\n")}`,
  ].join("\n\n"),
}));

fs.writeFileSync(out, JSON.stringify(articles, null, 1) + "\n");
console.log(`${articles.length} articles -> ${path.relative(process.cwd(), out)} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
