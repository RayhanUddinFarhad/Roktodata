import mongoose from "mongoose";

// Named running numbers, e.g. the serial printed on each photo card.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model("Counter", counterSchema);

// Atomically takes the next number for `name` (1, 2, 3, ...).
export async function nextSequence(name) {
  const counter = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { returnDocument: "after", upsert: true });
  return counter.seq;
}

export async function currentSequence(name) {
  return (await Counter.findById(name).lean())?.seq ?? 0;
}
