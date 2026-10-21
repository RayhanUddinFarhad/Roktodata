import { nextSequence } from "../models/Counter.js";

export const PHOTOCARD_COUNTER = "photocard";

// POST /api/photocards/serial
// Gives a new photo card its serial number; the running total is how many cards have been made.
export async function issueSerial(_req, res) {
  const serial = await nextSequence(PHOTOCARD_COUNTER);
  res.status(201).json({ success: true, serial });
}
