# Active Tasks (as of 2026-10-28)

## Current state
- Live: frontend on Vercel, backend on Render, MongoDB Atlas. Latest commit `cef7e69` (listPriority sort, 2026-10-29); before it `3f3344e` (banner wording: "কেউ টাকা চাইলে বা খারাপ ব্যবহার করলে কার্ডের অভিযোগ বাটনে জানান"), pushed 2026-10-29; AI assistant `847cac8` live; `GEMINI_API_KEY` set on Render, live check passed (compatibility answer 3 s; Dhaka O+ search 6 s, 1,194 donors).
- Shipped 2026-10-28:
  - `1acfe4d` — admin donor list returns `searchHidden` (`not_ready | recent_donation | null`) + `searchHiddenUntil`; `DonorsPanel` shows a "সাইটে দেখাচ্ছে না · DATE থেকে দেখাবে" badge; register/update message tells a recently-donated donor the day they appear in search. Triggered by "approved donor not on the site" reports (e.g. last donation 2026-09-21 → visible from 2026-12-20).
  - `a0e7b80` — new `Donor.verifiedAt`, set on every SMS-verified register/update; search sort is verified → has name → oldest last donation. Admin-added (`admin:manual`) donors no longer rank above imports.
- Imported 2026-10-29: "সিকদার পাড়া ব্লাড ব্যাংক (Responses).pdf" (Google Form, 45 rows) → 37 new donors, source `import:sikdarpara-bloodbank-2026-10`, `listPriority: 1` (+ 2 existing donors with the same numbers raised to 1, otherwise unchanged). Skipped: 3 abroad, 1 test number, 1 broken number, 1 repeat. Mostly কক্সবাজার/চকরিয়া; row 13 ("আলির বাপের পাড়া") assumed চকরিয়া. Report: `F:Project for clientsikdarpara-import-report.csv`. Script in the session scratchpad (`sikdar/import.mjs`). Donors in DB after: 14,886.
- Built 2026-10-29:
  - `847cac8` — AI assistant "রক্তদাতা সহকারী" on Google Gemini free tier (user's choice over Claude Haiku 5.5 for cost). `POST /api/assistant/chat` streams SSE (`text` / `card` / `done` / `error`); tools in `utils/assistantTools.js` (search_donors, list_blood_requests, next_donation_date, blood_compatibility, read_article); system prompt `utils/assistantPrompt.js`; articles exported to `config/learnArticles.json` by `scripts/export-learn-articles.mjs` (re-run when `lib/articles.ts` changes). Models: `gemini-3.6-flash`, fallback `gemini-3.5-flash-lite` (3.8 Flash timed out on free tier). Free tier = 15 requests/min/model and Google may use prompts to improve its products — UI tells people not to type personal details. UI: `components/assistant/AssistantLauncher` (floating "প্রশ্ন করুন") on home, /learn, /learn/[slug], /register + `/assistant` page; admin `AssistantStats`. Tested on fake data: 34 questions, all grounded/correct after spacing requests.
- Shipped 2026-10-28:
  - `0a453a7` — feedback / testimonials: `POST /api/feedback` (name, district, optional thana, role `patient|donor`, message 10–500 chars, optional private phone; no SMS code — hidden `website` honeypot + `feedbackLimiter` 3 saved/hour/IP), `GET /api/feedback` (approved only, newest approval first, `limit` ≤ 24). Admin "ফিডব্যাক" tab (`FeedbackPanel`: approve / reject / edit / delete; pending count in stats `pendingFeedback`). Shown in home `FeedbackSection` (6 latest, swipe on phones) and `/feedback` page (12 + "আরও দেখুন"); fulfilled request cards link to `/feedback#write` (opens the form). "ফিডব্যাক" is in the ☰ menu (`menuOnly` in `NAV_LINKS`) and footer; `/feedback` in sitemap. Public pages cache it for minutes (`lib/feedback.ts`), so an approval shows within ~1–2 min.
  - `0667f41` — contact rules: `ContactPledge` banner above donor lists (`DonorSearch`, `PatientSearch`) + bottom sheet on the first call/WhatsApp tap (`lib/contactPledge.ts` `guardContact`). "রাজি আছি" continues the call and is remembered 30 days (`rd-contact-pledge` in localStorage); "বাতিল" only closes; contact taps are counted only when the call really goes ahead.
- Live DB snapshot (2026-10-28, read-only): 14,806 Active donors, 14,536 shown in search; hidden: 80 recent donation, 160 not ready with date, 30 not ready without date. 561 website donors since SMS codes started.
- Earlier: admin edit of any donor incl. return date (`PATCH /api/admin/donors/:id`), "not ready → 120 days after last donation" option, app-install counting, push notifications (nearby requests, eligibility reminders, admin broadcast), PWA install flow, OTP digit boxes, font/perf work.
- Working tree: `roktodata-frontend/src/components/FraudDonors.tsx` has a user-owned whitespace change — leave it out of commits.

## In-Progress / Pending Tasks
- **Search Console fixes (started)**
  - "Excluded by noindex": intentional for 0-donor district/group pages and `/admin` — confirm none are in `sitemap.ts`.
  - "Alternate page with proper canonical": query URLs (e.g. `/register?...&hide=1` from `DonorCard`, `?source=`, filters) — add `rel="nofollow"` / avoid crawlable query links.
  - "Page with redirect": http/non-www → https://roktodata.org, normal; make sure sitemap and canonicals use the final URL.
- **Verify on live**: admin donor edit, the 120-day option, the hidden-from-search badge and verified-first ordering on the Render backend (needs admin login).
- **Known gap**: imported donors who updated themselves before 2026-10-28 have no `verifiedAt` (not detectable — contact taps also change `updatedAt`); they move up on their next self-update.
- **AI assistant next steps**: watch admin stats 2–3 weeks (from 2026-10-29); then maybe add it to donor-list pages; optional portfolio case-study page; optional switch to Claude (`claude-haiku-5-5`) if free-tier limits/quality hurt.
- **Not committed**: `.context/` itself (waiting for the user to say whether it goes in git).
- **Waiting on user**: answer on the multi-phone warning in the admin paste parser (`lib/donorParse.ts`).
- Marketing work lives outside this repo (Remotion cartoons in `F:\Project for client\Roktodata-cartoon-*`, song video in `Roktodata-song`, waiting for `song.mp3`).

## Recent Architectural Decisions
- **Requests auto-publish** when the phone is OTP-verified, hospital given, and the number isn't fraud-listed/blocked; donors still need admin approval.
- **Web push instead of SMS** for reminders and request alerts (cost); 50 km radius via district centroids; max 3 request pushes per device per day; sending is fire-and-forget.
- **PWA instead of a native APK**; install prompt captured early; installs counted per random device id.
- **Admin can edit every donor field** incl. `readyAgainAt`; another donor's phone → 409 `DUPLICATE_PHONE`.
- **Return-date choices**: 90 days (`eligible`) or 120 days (`eligible120`) after last donation, or a fixed date.
- **Canvas text aligned manually** (`lib/canvasCompat.ts`) for in-app browsers.
- **Only the Bengali font subset is preloaded** to cut first-paint cost.
- **90-day rule stays strict in search**: approved donors who gave blood < 90 days ago are hidden. `searchHiddenReason()` (`utils/findDonors.js`, mirrors `visibleDonorFilter`) feeds an admin badge ("সাইটে দেখাচ্ছে না · DATE থেকে দেখাবে") and the register/update success message.
- **Prioritised lists**: `Donor.listPriority` (default 0) ranks a trusted imported list right after verified donors in every search (sort: verified → listPriority → has name → longest since last donation).
- **Verified donors first in every search**: `verifiedAt` (SMS-verified self register/update) ranks donors on top in donor + patient search; imported donors move up once they update themselves. Past self-updates of imported donors can't be detected, so they were not backfilled.
- **Contact rules shown at the moment of contact, not as a page-blocking popup**: no redirect to home on "no" (emergency users, Google intrusive-interstitial risk). Requesters can't actually be banned yet — the "bad behaviour" rule is worded softly until a requester-report feature exists.
- **Feedback without SMS verification** (user's choice): spam is held back by admin approval, a honeypot and a per-IP limit. No star-rating / Review JSON-LD (Google treats self-serving reviews badly) and no photo upload for now. Possible later: share an approved feedback as a Facebook image card.
- **AI assistant design**: facts come from code/tools and the site's own articles, never the model's memory; phone numbers only in cards (never sent to the model); chat history lives in the browser (sessionStorage), nothing stored server-side except daily counts (`AssistantUsage`); not a popup — opens only on tap; phase 1 only on learning/registration pages.
- **Thin SEO pages are noindex** and excluded from the sitemap.
- **Test harness** (not in repo): in-memory MongoDB with fake data + headless Edge screenshots; uses a fixed data dir to avoid filling the disk.

## Print banners (2026-10-29)
Promotional banners with a QR code, for hospitals and volunteer events, in `F:\Project for client\Roktodata-facebook\`:
- `src/banner-need-blood.html` ("রক্ত লাগবে?", QR → roktodata.org) and `src/banner-give-blood.html` ("রক্ত দিন, জীবন বাঁচান", QR → roktodata.org/register).
- Each HTML has both shapes, chosen by `@media (orientation)`: 750x1800 (2.5x6 ft roll-up) and 1800x900 (6x3 ft).
- Rendered at scale 4 (about 100 dpi) to `banners/`: `hospital-rokto-lagbe-2.5x6ft.png`, `hospital-rokto-lagbe-6x3ft.png`, `event-rokto-din-2.5x6ft.png`, `event-rokto-din-6x3ft.png`.
- Re-render: `node src/render.mjs src/<file>.html 750 1800 banners/<out>.png 4` (or `1800 900`).
- The QR uses level H, so the logo in the middle doesn't stop it scanning. The "১৪,০০০+ রক্তদাতা" figure should be updated as the count grows.

## Home request banner wording (2026-10-31)
`e377eeb` — `components/home/RequestPosterBanner.tsx` now reads "অনুরোধ করুন, ৫০ কিমির মধ্যে নোটিফিকেশন চালু থাকা সবাই জানতে পারবেন। সাথে পাবেন পোস্ট করার মতো পোস্টার।" Deliberately not "সকল রক্তদাতা": request pushes reach only devices with notifications on (donor or not), about 50 km by district centre / IP, at most 3 per device per day. Keep public copy true to this so requesters don't assume every donor was told.

## "Respect donors" Facebook poster (2026-10-31)
`Roktodata-facebook/src/respect-donors.html` → `posters/respect-donors.png` (2160x2700). Uses `assets/relative-post-crop.png`: a Facebook post cropped to its text only, so the poster's real name and photo are left out. The rules sheet is redrawn in HTML from `ContactPledge.tsx`; update it if those rules change.

Simpler version of that poster, only the cropped post and a call to give blood: `src/give-blood-cry.html` → `posters/give-blood-cry.png` (2160x2700).

Second wording of the simple poster ("আপনি রক্ত দিচ্ছেন না বলেই হাহাকার থামছে না"): `src/give-blood-cry-2.html` → `posters/give-blood-cry-2.png`.

Poster on the rules shown before calling a donor ("রক্ত দেন বিনামূল্যে, সম্মান তাঁর প্রাপ্য"): `src/donor-honor.html` → `posters/donor-honor.png`. Its rules are copied from `ContactPledge.tsx`.

## Developer credit changed to NokshaByte (2026-10-31, not committed yet)
`lib/data.ts` now has `DEVELOPER_NAME = "NokshaByte"` and `DEVELOPER_URL = "https://www.nokshabyte.com"`. The footer credit links to that site; the About page developer card shows `public/nokshabyte-logo.svg` (copied from `F:\Projectsss\Nokshabyte\logo\final\svg\nokshabyte-logo-stacked-color.svg`), "সফটওয়্যার স্টুডিও" and the website link. Its email is deliberately not shown: `hello@nokshabyte.com` delivery is unconfirmed in that project's `.context`. `src/lib/developer-pic.jpg` is now unused but kept. The old poster `Roktodata-facebook/src/kts-collab.html` still credits the previous developer.
