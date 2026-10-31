# Architecture — Roktodata (রক্তদাতা)

Bangla blood-donor directory for Bangladesh. Donors register by phone (SMS code), patients post blood requests, visitors search and call donors. Site: roktodata.org. All user-facing text is Bangla.

## Tech stack
- **Frontend** `roktodata-frontend/` — Next.js 16.4.2 (App Router, `cacheComponents`, `partialPrefetching`, Turbopack), React 19.3, TypeScript (strict), Tailwind CSS 4 (`@theme inline` in `globals.css`), lucide-react icons. Hosted on **Vercel**.
  - `AGENTS.md`: this Next.js differs from older versions — read `node_modules/next/dist/docs/` before using framework APIs.
- **Backend** `roktodata-backend/` — Node (ESM, `node --env-file-if-exists=.env`), Express 5, Mongoose 9 (MongoDB Atlas), zod 4, helmet, cors, morgan, express-rate-limit, jsonwebtoken, web-push. Hosted on **Render**.
- **Jobs** — GitHub Actions `.github/workflows/eligibility-reminders.yml` calls `POST /api/jobs/eligibility-reminders` daily with `JOBS_SECRET`.
- **SMS** — external SMS API (key in env) for OTP codes only.
- No test suite; no state library; no ORM besides Mongoose.

## Repo layout
- `/` — `.github/workflows`, `docs/screenshots`, `README.md`, two app folders (not a workspace/monorepo tool).
- **Backend**
  - `server.js` (connect + listen), `app.js` (middleware + route mounts).
  - `config/` — `constants.js` (statuses, reasons, `ELIGIBILITY_DAYS=90`, `TIME_ZONE`), `db.js`, `env.js` (validated env), `locations.js` (districts → thanas), `districtCoords.js`, `nameTokens.json`.
  - `controllers/` — admin, app, complaint, contact, donor, fraud, job, otp, patient, photocard, push.
  - `middleware/` — `errorHandler`, `rateLimiters`, `requireAdmin`, `requirePhoneVerification`, `sanitize`, `validate`.
  - `models/` — see `database-schema.md`.
  - `routes/` — one file per controller.
  - `utils/` — `AppError`, `banglaName` (English → Bangla names), `dhakaDate`, `findDonors`, `phoneToken`, `push`, `sms`.
  - `validators/schemas.js` — every zod schema.
  - `scripts/` — `seed`, one-off backfills (`backfill-*`, `resume-recent-donors`).
- **Frontend** `src/`
  - `app/(site)/` — public pages: home, about, app, blood-requests, celebrate, donors/[district]/[group], find-donor, fraud-donors, learn/[slug], patient-search, register.
  - `app/admin/` — admin panel (client app, noindex). `app/api/geo/route.ts` — the only Next API route.
  - `app/manifest.ts`, `robots.ts`, `sitemap.ts`.
  - `components/` — shared UI; `admin/`, `home/`, `learn/`, `photocard/` subfolders.
  - `lib/` — `api.ts` (all backend calls + types), `seo.ts`, `data.ts`, `locations.ts`, `articles.ts`, `photocard.ts`, `install.ts`, `push.ts`, `pushOffer.ts`, `canvasCompat.ts`, `donorParse.ts`, `adminToken.ts`, `stats.ts`.
  - `public/sw.js` — service worker.

## API surface (`app.js`)
- Mounts: `/api/otp`, `/api/donors`, `/api/patient`, `/api/complaints`, `/api/fraud-reports`, `/api/photocards`, `/api/admin`, `/api/jobs`, `/api/push`, `/api/app`; `GET /api/health`.
- Global: helmet, CORS from `CLIENT_ORIGIN`, JSON limit 10kb, query parser `"simple"`, `sanitizeInput`, `apiLimiter` on `/api`, then `errorHandler` last.

## Core flows
- **OTP** — send code → verify → short-lived JWT phone token (HS256, `purpose` claim, 15 min) → `requirePhoneVerification` on donor register/update.
- **Donor register** — upsert by phone; new donors are `Pending` until an admin approves; only `Active` donors are public. "Not ready" sets `notReadySince` and `readyAgainAt` (90 or 120 days after last donation, or a chosen date). Every register/update sets `verifiedAt`.
- **Donor search** — `utils/findDonors.js`, used by `/api/donors/search` and patient search. Shows `Active` donors who are ready and last gave blood ≥ 90 days ago (`visibleDonorFilter`; `searchHiddenReason` gives the same answer for one donor). Order: SMS-verified first (`verifiedAt`, or a website registration since 2026-10-18 05:53 UTC), then named, then longest since last donation.
- **Blood request** — one per phone per Dhaka day (unique index). Auto-published (`Approved`) when the phone is OTP-verified, hospital given, and the number is not fraud-listed/blocked; otherwise `Pending` for admin.
- **Push** — web-push (VAPID). New approved requests notify subscribers within 50 km (district centroids), max 3 request pushes per device per day; fire-and-forget (`notifyBloodRequestLater`). Daily job sends "you can donate again" pushes (no SMS).
- **PWA** — manifest + `sw.js` (network-first pages, offline page, static cache, push handlers). Install prompt captured early; installs counted via `POST /api/app/install` with a random `rd-device` id.
- **AI assistant** — `AssistantChat` posts the visible conversation (≤ 12 turns) to `/api/assistant/chat` → Gemini (`@google/genai`, `generateContentStream`, function calling, no SDK retries, 45 s timeout) → tool loop (max 4 rounds) → SSE back. 429/500/503/timeout → fallback model; a short "retry in Xs" 429 is waited out once (≤ 20 s). Limits: `ASSISTANT_PER_VISITOR_LIMIT` (20/IP/day), `ASSISTANT_DAILY_LIMIT` (500/day). Off while `GEMINI_API_KEY` is empty. Env: `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`.
- **Feedback** — public form (`FeedbackButton`, opens itself on `#write`) → `Pending` → admin approves in the "ফিডব্যাক" tab → shown by `FeedbackCard` on home (`home/FeedbackSection`) and `/feedback`. Server pages read it via cached `getLatestFeedback()` (`lib/feedback.ts`); more pages load client-side (`MoreFeedback`).
- **Contact rules** — any donor call/WhatsApp link must use `guardContact(e, kind, onGo)` and the page must render `<ContactPledge />` once (without it the guard lets links through).
- **Photocards / posters** — drawn client-side on `<canvas>`; serials reserved via `/api/photocards`.

## Key rules
- Never commit or print `.env` values (JWT, VAPID private key, JOBS_SECRET, SMS key, admin password).
- Frontend talks to the backend only through `lib/api.ts` (`NEXT_PUBLIC_API_URL`).
- Dates that mean "a day" use Bangladesh time (`utils/dhakaDate.js`, `TIME_ZONE`).
- Public lists show only `Active` donors / `Approved`(+`Fulfilled`) requests.
- Any change to search visibility must update `visibleDonorFilter` and `searchHiddenReason` together (admin badge relies on them agreeing).
- Only SMS-verified self actions set `verifiedAt`; admin edits/imports must not.
- Canvas text: call `alignTextManually(ctx)` — some in-app browsers ignore center/right alignment for Bangla.
- Fonts: Hind Siliguri, preload the `bengali` subset only.
- Thin pages (district/group with 0 donors) are `noindex` and left out of the sitemap.
