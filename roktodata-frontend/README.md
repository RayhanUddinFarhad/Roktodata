# Roktodata website

Next.js 16 frontend for [রক্তদাতা · Roktodata](https://www.roktodata.org). See the
[main README](../README.md) for the full project overview.

## Setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL: the Express API (default http://localhost:5000)
npm run dev                  # http://localhost:3000
```

The API in [`../roktodata-backend`](../roktodata-backend) must be running for searches and forms.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |

## Pages

| Route | Page |
| --- | --- |
| `/` | Home: quick search, how it works, donation benefits |
| `/find-donor` | Donor search by blood group, district and thana (60 per page) |
| `/donors`, `/donors/<district>` | District index and one page per district with donor counts |
| `/patient-search` | Submit a patient's request and get matching donors at once |
| `/blood-requests` | Public feed of approved requests |
| `/register` | Donor registration or update with SMS code verification |
| `/fraud-donors` | Fraud list, number check and reporting |
| `/about` | About the project |
| `/admin` | Admin panel (not indexed by search engines) |

## Notes

- **Bangla first.** Text, digits (`toBanglaNumber`) and location names are in Bangla. Districts and
  thanas live in `src/lib/locations.ts` and must match the backend's `config/locations.js`.
- **Cache Components** are enabled (`next.config.ts`). District donor counts come from
  `GET /api/donors/stats` through a `"use cache"` function (`src/lib/stats.ts`) and refresh hourly.
- **SEO.** `src/lib/seo.ts` has the site URL, district slugs and `pageMetadata()`, which every public
  page uses for its title, description, canonical URL and share image (`public/og-image.png`).
- **Cold starts.** `ApiWarmup` pings the API on page load, and the API client retries with a timeout,
  so a sleeping free-tier API doesn't leave searches stuck.
