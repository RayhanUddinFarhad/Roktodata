// Inserts sample donors for local development. Existing donors with the same phone number are updated.
// Usage: npm run seed
import { connectDB, disconnectDB } from "../config/db.js";
import { Donor } from "../models/Donor.js";

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const SAMPLE_DONORS = [
  { fullName: "তারেক রহমান", phoneNumber: "01711223344", bloodGroup: "A+", district: "ঢাকা", upazila: "ধানমন্ডি", lastDonationDate: daysAgo(120) },
  { fullName: "মো. আল-আমিন", phoneNumber: "01822334455", bloodGroup: "B+", district: "চট্টগ্রাম", upazila: "মিরসরাই", lastDonationDate: daysAgo(200) },
  { fullName: "নুসরাত জাহান", phoneNumber: "01933445566", bloodGroup: "O+", district: "সিলেট", upazila: "কোতোয়ালী", lastDonationDate: daysAgo(30) },
  { fullName: "কামরুল হাসান", phoneNumber: "01644556677", bloodGroup: "AB+", district: "রাজশাহী", upazila: "বোয়ালিয়া", lastDonationDate: null },
  { fullName: "ফারিহা ইসলাম", phoneNumber: "01555667788", bloodGroup: "O-", district: "ঢাকা", upazila: "উত্তরা", lastDonationDate: daysAgo(95) },
  { fullName: "সাকিব হোসেন", phoneNumber: "01799887766", bloodGroup: "B+", district: "চট্টগ্রাম", upazila: "মিরসরাই", lastDonationDate: daysAgo(40) },
];

await connectDB();
await Donor.syncIndexes();
const result = await Donor.bulkWrite(
  SAMPLE_DONORS.map((donor) => ({
    updateOne: { filter: { phoneNumber: donor.phoneNumber }, update: { $set: { ...donor, status: "Active", isReadyToDonate: true } }, upsert: true },
  })),
);
console.log(`Seeded donors: ${result.upsertedCount} created, ${result.modifiedCount} updated.`);
await disconnectDB();
