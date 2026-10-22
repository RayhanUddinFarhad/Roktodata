import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Donor } from "../models/Donor.js";
import { DonorContact } from "../models/DonorContact.js";

// Taps by the same visitor on the same button for the same donor within this time count once.
const REPEAT_MS = 30 * 60 * 1000;

const visitorOf = (req) => createHash("sha256").update(`${req.ip}:${env.JWT_SECRET}`).digest("hex").slice(0, 32);

// POST /api/donors/:id/contact?type=call|whatsapp
// Counts a tap on a donor's call or WhatsApp button (sent with navigator.sendBeacon, so nothing
// waits for it). Always answers 204, so it reveals nothing about the donor.
export async function recordContact(req, res) {
  const { id, type } = req.validated;
  const visitor = visitorOf(req);
  const repeat = await DonorContact.exists({
    donor: id,
    type,
    visitor,
    createdAt: mongoose.trusted({ $gte: new Date(Date.now() - REPEAT_MS) }),
  });
  if (!repeat) {
    const donor = await Donor.findOneAndUpdate(
      { _id: id, status: "Active" },
      { $inc: { [`contacts.${type}`]: 1, "contacts.total": 1 }, $set: { lastContactedAt: new Date() } },
    );
    if (donor) await DonorContact.create({ donor: id, type, visitor });
  }
  res.status(204).end();
}
