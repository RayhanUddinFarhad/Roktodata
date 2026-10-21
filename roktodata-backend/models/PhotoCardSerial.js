import mongoose from "mongoose";

// One photo card serial number. It is reserved as soon as someone starts a card (so the number
// shows on the card while they edit it) and becomes "used" when the card is downloaded or shared.
// A reservation that is never used is given to someone else after a while.
const photoCardSerialSchema = new mongoose.Schema({
  _id: { type: Number, required: true }, // the serial number itself
  token: { type: String, required: true }, // proves the reservation belongs to this browser
  used: { type: Boolean, default: false },
  reservedAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
});

// Finds the oldest expired reservation to hand out again.
photoCardSerialSchema.index({ used: 1, reservedAt: 1 });

export const PhotoCardSerial = mongoose.model("PhotoCardSerial", photoCardSerialSchema);
