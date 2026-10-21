import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { nextSequence } from "../models/Counter.js";
import { PhotoCardSerial } from "../models/PhotoCardSerial.js";
import { AppError } from "../utils/AppError.js";

export const PHOTOCARD_COUNTER = "photocard";
// An unused reservation is kept this long (renewed whenever the card page is opened again), then
// its number goes to the next new card.
const RESERVATION_MS = 2 * 60 * 60 * 1000;

const newToken = () => randomBytes(16).toString("hex");

// A number for a new card: the lowest expired reservation if there is one, otherwise the next number.
async function reserveNew() {
  const token = newToken();
  const now = new Date();
  const reclaimed = await PhotoCardSerial.findOneAndUpdate(
    { used: false, reservedAt: mongoose.trusted({ $lt: new Date(now.getTime() - RESERVATION_MS) }) },
    { $set: { token, reservedAt: now } },
    { sort: { _id: 1 }, returnDocument: "after" },
  );
  if (reclaimed) return { serial: reclaimed._id, token };
  const serial = await nextSequence(PHOTOCARD_COUNTER);
  await PhotoCardSerial.create({ _id: serial, token, reservedAt: now });
  return { serial, token };
}

// POST /api/photocards/serial/reserve  { serial?, token? }
// Reserves a serial for a card being made. With the browser's current reservation, renews it if it
// is still theirs; otherwise gives a new one.
export async function reserveSerial(req, res) {
  const { serial, token } = req.validated;
  if (serial && token) {
    const renewed = await PhotoCardSerial.findOneAndUpdate({ _id: serial, token, used: false }, { $set: { reservedAt: new Date() } });
    if (renewed) return res.json({ success: true, serial, token });
  }
  res.status(201).json({ success: true, ...(await reserveNew()) });
}

// POST /api/photocards/serial/confirm  { serial, token }
// The card was downloaded or shared: its serial is now used for good. Confirming again is fine.
// 409 when the reservation expired and the number went to someone else.
export async function confirmSerial(req, res) {
  const { serial, token } = req.validated;
  const confirmed =
    (await PhotoCardSerial.findOneAndUpdate({ _id: serial, token, used: false }, { $set: { used: true, usedAt: new Date() } })) ??
    (await PhotoCardSerial.exists({ _id: serial, token, used: true }));
  if (!confirmed) throw new AppError(409, "এই কার্ড নাম্বারটির সময় শেষ হয়ে গেছে। নতুন নাম্বার নিন।", "SERIAL_EXPIRED");
  res.json({ success: true, serial });
}

// How many cards have been made: serials that were downloaded or shared.
export const photoCardsMade = () => PhotoCardSerial.countDocuments({ used: true });
