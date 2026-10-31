# Database Schema (MongoDB via Mongoose 9)

Models live in `roktodata-backend/models/`. `timestamps: true` (createdAt/updatedAt) unless noted.

## Donor
- `fullName`, `phoneNumber` (**unique**, BD 11-digit), `bloodGroup` (`BLOOD_GROUPS`), `district`, `upazila` (default "").
- `lastDonationDate` (null), `isReadyToDonate` (true), `readyAgainAt` (null), `notReadySince` (null), `eligibleReminderFor` (which eligibility date was already pushed).
- `contacts { call, whatsapp, total }`, `lastContactedAt`.
- `status`: `Pending | Active | Blocked` (new = Pending); `blockReason`, `blockedAt`, `hiddenFromFraudList`.
- `source`: `website`, `admin:manual`, `import:<batch>`.
- `listPriority`: number, default 0; higher ranks earlier in search right after verified donors (1 = Sikdar Para blood bank list).
- `verifiedAt`: set on every SMS-verified self register/update (not by admin edits or imports). Search ranks these first; website donors created since 2026-10-18 05:53 UTC count as verified too.
- Indexes: `{ bloodGroup, district, upazila }` (search), `{ status, createdAt: -1 }` (admin lists).

## PatientRequest
- `patientName`, `requiredBloodGroup`, `district`, `upazila`, `hospitalAddress`, `reason`, `requesterPhone`, `bagsNeeded`, `neededDate`.
- `status`: `Pending | Approved | Rejected | Fulfilled`; `adminNote`; `notifiedAt` (push sent); `requestDay` (Dhaka `YYYY-MM-DD`).
- createdAt only.
- Indexes: unique partial `{ requesterPhone, requestDay }` (one per day), TTL on `neededDate` (+18h), `{ status, createdAt }`.

## OtpCode
- `phoneNumber`, `codeHash`, `expiresAt`, `attempts`, `usedAt`. TTL 24h on createdAt; index `{ phoneNumber, createdAt }`.

## Complaint
- `donor` (ref Donor), `complainantPhone`, `reason` (`COMPLAINT_REASONS`), `details`, `status`: `Open | Resolved | Dismissed`. Indexed by status/donor.

## FraudReport
- `phoneNumber`, `name`, `reason` (`FRAUD_REASONS`), `details`, `reporterPhone`, `status`: `Pending | Approved | Rejected`. Indexes on status and phoneNumber.

## DonorContact
- `donor`, `type` (`call | whatsapp`), `visitor` (hash). createdAt only. Used to count unique contacts.

## Counter
- `_id` (string name), `seq`. Helpers `nextSequence(name)`, `currentSequence(name)`.

## PhotoCardSerial
- `_id` (number serial), `token`, `used`, `reservedAt`, `usedAt`. Index `{ used, reservedAt }`.

## PushSubscription
- `endpoint` (**unique**), `keys { p256dh, auth }`, `district` (+ `districtChosen`), `lat`/`lng`, `donor` (ref, optional), `requestPushDay` + `requestPushCount` (daily cap), `lastSeenAt`.
- Indexes: TTL on `lastSeenAt` (180 days), partial on `donor`, `district`.

## AssistantUsage
- `_id` = Dhaka day `YYYY-MM-DD`; `questions`, `fallbacks`, `failures`, `capped`, `inputTokens`, `outputTokens`, `tools` (Map name → count). Counts only — never message text. Upserted with `$inc` after each question.

## Feedback
- `name` (≤ 60), `district` (enum), `upazila` (default ""), `role` (`patient | donor`, `FEEDBACK_ROLES`), `message` (≤ 500), `phoneNumber` (optional, admin-only, never public).
- `status`: `Pending | Approved | Rejected` (`FEEDBACK_STATUS`); `approvedAt` (set on first approval, keeps the list order stable).
- Indexes: `{ status, approvedAt: -1 }` (public list), `{ status, createdAt: -1 }` (admin list).

## AppInstall
- `device` (**unique**, random id from the browser), `platform` (`android | ios | …`). Index on createdAt.

## Query conventions
- Wrap every operator in `mongoose.trusted(...)` (`sanitizeFilter` is on).
- Public reads filter `status: "Active"` (donors) or `Approved/Fulfilled` (requests); use `.lean()` and project only public fields (never phone numbers of hidden donors).
- Donor search goes through `utils/findDonors.js` (same upazila first, then the rest of the district; respects `isReadyToDonate`/`readyAgainAt`). Order: verified → listPriority → has name → longest since last donation.
- "Per day" logic uses `dhakaDay()` from `utils/dhakaDate.js`.
- Rely on unique indexes for races; catch 11000 and turn it into a Bangla 409.
- Schema changes that need existing data updated get a `scripts/backfill-*.js` (dry-run first).
