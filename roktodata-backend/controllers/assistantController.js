import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { AssistantUsage } from "../models/AssistantUsage.js";
import { AppError } from "../utils/AppError.js";
import { SYSTEM_INSTRUCTION } from "../utils/assistantPrompt.js";
import { runTool, TOOL_DECLARATIONS } from "../utils/assistantTools.js";
import { dhakaDay } from "../utils/dhakaDate.js";

// A question may need a few tool rounds (e.g. read an article, then search donors); more means a loop.
const MAX_ROUNDS = 4;

// No retries inside the SDK (its back-off on "high demand" kept a visitor waiting minutes): a failed
// or slow call goes straight to the fallback model instead.
let client;
const gemini = () =>
  (client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY, httpOptions: { timeout: 45_000, retryOptions: { attempts: 1 } } }));

// Out of quota, overloaded ("high demand"), failing or timed out: worth trying the other model.
const isRetryable = (err) => (err instanceof ApiError ? [429, 500, 503].includes(err.status) : err?.name === "AbortError");

// The free tier allows a few requests per minute per model; a 429 says when the next one is allowed
// ("Please retry in 12.48s"). Waiting that long beats an error, up to this much.
const MAX_WAIT_MS = 20_000;
function retryDelayMs(err) {
  if (!(err instanceof ApiError) || err.status !== 429) return null;
  const seconds = String(err.message).match(/retry in ([\d.]+)s/i)?.[1];
  return seconds ? Math.ceil(Number(seconds) * 1000) : null;
}

// GET /api/assistant/status
export function assistantStatus(_req, res) {
  res.json({ success: true, enabled: Boolean(env.GEMINI_API_KEY) });
}

// POST /api/assistant/chat  { messages: [{ role: "user" | "assistant", text }] }
// Streams the answer as server-sent events: {type:"text", text} pieces, {type:"card", card} for donor
// or request cards, then {type:"done"} or {type:"error", message}.
export async function chat(req, res) {
  if (!env.GEMINI_API_KEY) throw new AppError(503, "রক্তদাতা সহকারী এখন বন্ধ আছে। একটু পরে আবার চেষ্টা করুন।", "ASSISTANT_OFF");

  const day = dhakaDay();
  const today = await AssistantUsage.findById(day).lean();
  if ((today?.questions ?? 0) >= env.ASSISTANT_DAILY_LIMIT) {
    await AssistantUsage.updateOne({ _id: day }, { $inc: { capped: 1 } }, { upsert: true });
    throw new AppError(429, "আজ অনেক প্রশ্ন এসেছে, সহকারী আজকের মতো বিশ্রামে। কাল আবার আসুন, অথবা সরাসরি ডোনার খুঁজুন।", "ASSISTANT_DAILY_LIMIT");
  }

  res.set({ "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" });
  res.flushHeaders();
  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  // The visitor closed the chat or the page: stop asking the model.
  const abort = new AbortController();
  res.on("close", () => !res.writableEnded && abort.abort());

  const contents = req.validated.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));
  const stats = { questions: 1, fallbacks: 0, failures: 0, inputTokens: 0, outputTokens: 0 };
  const tools = {};
  let model = env.GEMINI_MODEL;
  let wroteText = false;
  let waited = false;

  // One model turn, streamed. Out of quota or overloaded before anything was sent: once more on the
  // fallback model, which then answers the rest of this question. If that one is over its per-minute
  // quota too and Google says it frees up within MAX_WAIT_MS, wait once and try again.
  async function turn() {
    const parts = [];
    let usage;
    try {
      const stream = await gemini().models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          maxOutputTokens: 2048,
          abortSignal: abort.signal,
        },
      });
      for await (const chunk of stream) {
        usage = chunk.usageMetadata ?? usage;
        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
          parts.push(part);
          if (part.text && !part.thought) {
            wroteText = true;
            send({ type: "text", text: part.text });
          }
        }
      }
    } catch (err) {
      if (isRetryable(err) && !abort.signal.aborted && !wroteText && parts.length === 0 && model !== env.GEMINI_FALLBACK_MODEL) {
        model = env.GEMINI_FALLBACK_MODEL;
        stats.fallbacks = 1;
        return turn();
      }
      const wait = retryDelayMs(err);
      if (wait !== null && wait <= MAX_WAIT_MS && !waited && !abort.signal.aborted && !wroteText && parts.length === 0) {
        waited = true;
        await new Promise((resolve) => setTimeout(resolve, wait + 500));
        return turn();
      }
      throw err;
    }
    stats.inputTokens += usage?.promptTokenCount ?? 0;
    stats.outputTokens += (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
    return parts;
  }

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const parts = await turn();
      const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);
      if (calls.length === 0) break;
      // The model's turn goes back unchanged (it may carry thought signatures the API checks).
      contents.push({ role: "model", parts });
      const responses = await Promise.all(
        calls.map(async (call) => {
          tools[call.name] = (tools[call.name] ?? 0) + 1;
          const { result, card } = await runTool(call.name, call.args);
          if (card) send({ type: "card", card });
          return { functionResponse: { id: call.id, name: call.name, response: result } };
        }),
      );
      contents.push({ role: "user", parts: responses });
    }
    if (!wroteText) send({ type: "text", text: "দুঃখিত, উত্তরটা গুছিয়ে দিতে পারলাম না। প্রশ্নটা একটু অন্যভাবে লিখে দেখবেন?" });
    send({ type: "done" });
  } catch (err) {
    if (!abort.signal.aborted) {
      stats.failures = 1;
      console.error("assistant chat failed:", err.status ?? "", err.message);
      send({
        type: "error",
        message: isRetryable(err)
          ? "সহকারী এই মুহূর্তে অনেক ব্যস্ত। এক মিনিট পর আবার চেষ্টা করুন।"
          : "সহকারী উত্তর দিতে পারেনি। একটু পরে আবার চেষ্টা করুন।",
      });
    }
  } finally {
    res.end();
    const inc = { ...stats, ...Object.fromEntries(Object.entries(tools).map(([name, n]) => [`tools.${name}`, n])) };
    AssistantUsage.updateOne({ _id: day }, { $inc: inc }, { upsert: true }).catch((err) => console.error("assistant usage not saved:", err.message));
  }
}

// Last 7 Bangladesh days of use, for the admin panel.
export async function assistantSummary() {
  const since = dhakaDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const days = await AssistantUsage.find({ _id: mongoose.trusted({ $gte: since }) }).lean();
  const sum = (key) => days.reduce((total, d) => total + (d[key] ?? 0), 0);
  const tools = {};
  for (const d of days) for (const [name, n] of Object.entries(d.tools ?? {})) tools[name] = (tools[name] ?? 0) + n;
  return {
    enabled: Boolean(env.GEMINI_API_KEY),
    today: days.find((d) => d._id === dhakaDay())?.questions ?? 0,
    week: sum("questions"),
    fallbacks: sum("fallbacks"),
    failures: sum("failures"),
    capped: sum("capped"),
    inputTokens: sum("inputTokens"),
    outputTokens: sum("outputTokens"),
    tools,
  };
}
