// One-time: marks the serial numbers handed out before reservations existed (1..current counter) as
// used, so they are never given to another card and count in "cards made".
// Usage: node --env-file=.env scripts/backfill-photocard-serials.js
import { randomBytes } from "node:crypto";
import { connectDB, disconnectDB } from "../config/db.js";
import { currentSequence } from "../models/Counter.js";
import { PhotoCardSerial } from "../models/PhotoCardSerial.js";
import { PHOTOCARD_COUNTER } from "../controllers/photocardController.js";

await connectDB();
const last = await currentSequence(PHOTOCARD_COUNTER);
const now = new Date();
const result = last
  ? await PhotoCardSerial.bulkWrite(
      Array.from({ length: last }, (_, i) => ({
        updateOne: {
          filter: { _id: i + 1 },
          update: { $setOnInsert: { token: randomBytes(16).toString("hex"), used: true, reservedAt: now, usedAt: now } },
          upsert: true,
        },
      })),
    )
  : { upsertedCount: 0 };
console.log(`Serials 1-${last}: ${result.upsertedCount} marked as used (existing records left as they are).`);
await disconnectDB();
