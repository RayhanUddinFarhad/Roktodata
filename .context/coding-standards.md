# Coding Standards

## General
- Match the surrounding file: short comments that explain *why*, no banners, no commented-out code.
- User-facing strings are Bangla; code, identifiers and comments are English.
- Small focused modules; reuse helpers in `utils/` (backend) and `lib/` (frontend) before adding new ones.
- No new dependencies without a clear need (current deps are minimal on purpose).

## Naming
- Backend files: `camelCase.js` for controllers/routes/utils (`donorController.js`, `adminRoutes.js`), `PascalCase.js` for models (`Donor.js`, `PatientRequest.js`).
- Frontend: components `PascalCase.tsx`; lib modules `camelCase.ts`; route folders kebab-case (`blood-requests`, `find-donor`).
- Constants `UPPER_SNAKE` (`ELIGIBILITY_DAYS`, `BLOOD_GROUPS`, `AFTER_DONATION_DAYS`); functions verb-first camelCase (`readyAgainDate`, `linkDevice`, `updateAdminDonor`).
- Status enums are capitalised strings: `Pending | Active | Blocked`, `Pending | Approved | Rejected | Fulfilled`.

## TypeScript (frontend)
- `strict: true`. Types for API payloads live next to their fetchers in `lib/api.ts`; prefer string-literal unions (`ReadyAgain`) over enums.
- Server Components by default; add `"use client"` only for interactive pieces.
- State: `useState`, plus `useSyncExternalStore` for browser state (query string, install/push status). No Redux/Zustand/React Query.
- Styling: Tailwind utility classes inline; design tokens in `globals.css`. Layout must work at phone width.
- Metadata via `pageMetadata()` in `lib/seo.ts` (supports `noindex`).

## Backend patterns
- ESM only (`import`/`export`), async/await.
- Route = `router.<verb>(path, [limiter], [auth], validate(schema, source), controller)`.
- Controllers read input from `req.validated` only (merged by `validate`).
- Express 5 forwards rejected promises — throw, don't wrap in try/catch unless handling a specific error (e.g. duplicate key 11000).

## Validation
- Every request body/params/query has a zod 4 schema in `validators/schemas.js`; reuse shared pieces (phone, blood group, district/upazila, `pastDate`, `anyDate`, `idParamSchema`).
- Frontend validates for UX only; the backend is the source of truth.

## Error handling
- Throw `new AppError(status, banglaMessage, code?)`; `errorHandler` returns `{ success: false, message, code? }`.
- Mongo 11000 → 409, Mongoose ValidationError → 400, unknown → 500 with a generic message (no stack to clients).
- Success responses: `{ success: true, ... }`.
- Frontend: `lib/api.ts` throws `ApiError` (status, code, message) and retries transient failures; show `err.message` to the user.
- Fire-and-forget work (push) must catch and log its own errors.

## Security
- `sanitizeFilter` is on: any query operator (`$in`, `$gte`, …) must be wrapped in `mongoose.trusted(...)`; never pass raw user objects into queries.
- `sanitizeInput` strips `$`/`.` keys; JSON body limit 10kb; per-route rate limiters in `middleware/rateLimiters.js`.
- Admin routes behind `requireAdmin` (JWT); phone-bound actions behind `requirePhoneVerification`.
- Push endpoints restricted to known push-service hosts; device ids validated by regex.
- Never log or commit secrets; never expose donor phone numbers of non-`Active` donors.
- Scripts that touch the real DB: dry-run/read-only first, apply only after approval.
- Screenshots and promos use fake data only.

## Git
- Commit messages: short plain-English summary of the user-visible change; end with the `Co-Authored-By` line.
- The user sometimes edits files on GitHub (e.g. `.env.example`): fetch before pushing, and rebase (`--autostash`) instead of force-pushing.
- Keep each change in its own commit (e.g. the admin badge and the search order were committed separately).
- Don't commit unrelated working-tree changes (e.g. a stray edit in `FraudDonors.tsx`).
