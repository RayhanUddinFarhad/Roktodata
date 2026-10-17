# Roktodata API

Express + MongoDB (Mongoose) backend for the Roktodata frontend.

## Setup

```bash
npm install
cp .env.example .env   # then edit values (MongoDB URI, admin password, JWT secret)
npm run seed           # optional: approved sample donors for local development
npm run dev            # http://localhost:5000, restarts on source changes
```

`npm run dev` watches the source folders (`config`, `controllers`, `middleware`, `models`, `routes`,
`utils`, `validators`). Restart manually after editing `app.js`, `server.js` or `.env`.

Production: `NODE_ENV=production npm start`. Indexes are built automatically only outside production,
except the blood request expiry index, which `server.js` always creates: MongoDB deletes a request once
its needed date has passed in Bangladesh (requests without a needed date are kept).

## Donor visibility

New registrations are `Pending` and hidden until an admin approves them (`Active`). A donor appears in
public searches only when **all** of these hold:

- status is `Active` (approved, not blocked)
- `isReadyToDonate` is `true` (set by the donor on the registration page)
- last donation was at least 90 days ago, or never

## Endpoints

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/health` | – | Server and database status |
| POST | `/api/donors/register-or-update` | Firebase ID token* | Creates the donor (Pending), or updates them if the phone number exists |
| GET | `/api/donors/search?bloodGroup=&district=&upazila=` | – | Visible donors, longest since last donation first |
| POST | `/api/patient/search-and-log` | – | Saves the request (Pending) and returns `donors` in the upazila plus `nearbyDonors` elsewhere in the district. One request per phone number per Bangladesh day; a repeat gets 409 with `code: "DUPLICATE_REQUEST"` |
| GET | `/api/patient/requests?bloodGroup=&district=&page=` | – | Public feed: Approved/Fulfilled requests from the last 30 days, newest first (12 per page) |
| POST | `/api/complaints` | – | Complaint against a donor (`donorId`, `complainantPhone`, `reason`, `details?`) |
| POST | `/api/fraud-reports` | – | Report a fraudulent number (`phoneNumber`, `name`, `reason`, `details`, `reporterPhone`); Pending until approved. One active report per reporter per number |
| GET | `/api/fraud-reports?page=` | – | Public fraud list: approved reports grouped per number (reporter phones never included) |
| GET | `/api/fraud-reports/check?phone=` | – | `{ isFraud, entry }` for one number |
| POST | `/api/admin/login` | – | `{ username, password }` → `{ token }` |
| GET | `/api/admin/stats` | Admin | Counts of donors by status, open complaints, patient requests |
| GET | `/api/admin/donors?status=&q=&page=` | Admin | Donors (20 per page); `q` searches name or phone prefix |
| PATCH | `/api/admin/donors/:id/status` | Admin | `{ status: "Pending" \| "Active" \| "Blocked" }` |
| DELETE | `/api/admin/donors/:id` | Admin | Deletes the donor and their complaints |
| GET | `/api/admin/complaints?status=&page=` | Admin | Complaints with donor details |
| PATCH | `/api/admin/complaints/:id/status` | Admin | `{ status: "Open" \| "Resolved" \| "Dismissed" }` |
| GET | `/api/admin/requests?status=&page=` | Admin | Patient blood requests |
| PATCH | `/api/admin/requests/:id/status` | Admin | `{ status: "Pending" \| "Approved" \| "Rejected" \| "Fulfilled", note? }`; Approved/Fulfilled appear in the public feed |
| PATCH | `/api/admin/requests/:id/note` | Admin | `{ note }` (max 300 chars, empty clears it): admin update shown on the public post |
| DELETE | `/api/admin/requests/:id` | Admin | Deletes a request |
| GET | `/api/admin/fraud-reports?status=&page=` | Admin | Fraud reports with reporter phone and any registered donor using that number |
| PATCH | `/api/admin/fraud-reports/:id/status` | Admin | `{ status: "Pending" \| "Approved" \| "Rejected" }`; Approved reports are public |
| DELETE | `/api/admin/fraud-reports/:id` | Admin | Deletes a report |

\* Only when `REQUIRE_PHONE_VERIFICATION=true`; the token's phone number must match `phoneNumber`.
Admin routes need `Authorization: Bearer <token from /api/admin/login>`; tokens expire after `JWT_EXPIRES_IN`.
All error responses are `{ success: false, message }` with a Bengali message.

## Structure

```
config/       env validation, MongoDB connection, Firebase Admin, constants
models/       Donor, PatientRequest, Complaint
validators/   zod request schemas
middleware/   sanitization, validation, Firebase auth, admin auth, rate limits, error handling
controllers/  route handlers
routes/       /api/donors, /api/patient, /api/complaints, /api/admin
utils/        shared donor search, AppError
scripts/      seed.js
app.js        Express app (security middleware, routes)
server.js     DB connection, startup, graceful shutdown
```

## Security

- `helmet` headers, `cors` restricted to `CLIENT_ORIGIN`, JSON bodies capped at 10 kB
- `express-rate-limit`: 300 req / 15 min per IP on `/api`; tighter on registration, patient search,
  complaints, and admin login (10 failed attempts / 15 min)
- Input: every route validates with zod; `$`/`.` keys are stripped from bodies; query strings use the
  `simple` parser (no nested objects); Mongoose `sanitizeFilter` is on
- Admin login compares credentials in constant time and issues an HS256 JWT signed with `JWT_SECRET`
- Set `TRUST_PROXY` to the number of proxies in front of the app so rate limiting sees real client IPs
