import mongoose from "mongoose";

// One row per Bangladesh day of AI-assistant use: counts only, never what people wrote.
const assistantUsageSchema = new mongoose.Schema(
  {
    _id: { type: String }, // "YYYY-MM-DD"
    questions: { type: Number, default: 0 },
    // Answered by the fallback model because the main one was out of quota, overloaded or slow.
    fallbacks: { type: Number, default: 0 },
    // Questions that got no answer (both models failed).
    failures: { type: Number, default: 0 },
    // Turned away by the site-wide daily cap.
    capped: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    // How often each tool ran, e.g. { search_donors: 12 }.
    tools: { type: Map, of: Number, default: {} },
  },
  { versionKey: false },
);

export const AssistantUsage = mongoose.model("AssistantUsage", assistantUsageSchema);
