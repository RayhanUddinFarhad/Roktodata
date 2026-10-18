# Roktodata (রক্তদাতা)

A Bangla blood-donor network: patients find nearby donors by blood group and location, donors register
or update their availability, and admins approve donors and blood requests before they go public.

| Folder | Stack | Runs on |
| ------ | ----- | ------- |
| [`roktodata-frontend`](roktodata-frontend) | Next.js 16, React 19, Tailwind CSS 4 | http://localhost:3000 |
| [`roktodata-backend`](roktodata-backend) | Express 5, MongoDB (Mongoose) | http://localhost:5000 |

## Features

- **Find donors** (`/find-donor`): filter by blood group, district and upazila
- **Patient search** (`/patient-search`): submit patient details to get matching donors immediately;
  the request is posted publicly after admin approval (one request per phone number per day)
- **Blood requests** (`/blood-requests`): public feed of approved requests with a call button
- **Donor registration** (`/register`): register or update by phone number, confirmed with a 6-digit SMS code (sms.net.bd), including "ready to donate"
- **Complaints**: report a donor from any donor card
- **Fraud donors** (`/fraud-donors`): check a number against the admin-approved fraud list, or report one
- **Thana dropdowns**: every location form picks the thana/upazila from the chosen district's list
- **Admin panel** (`/admin`): approve donors, blood requests and fraud reports, handle complaints, block donors

Donors appear publicly only when approved, marked ready, and their last donation was 90+ days ago.

## Running locally

Requires Node.js 20.9+ and a MongoDB database (local or Atlas).

```bash
# 1. Backend
cd roktodata-backend
npm install
cp .env.example .env      # fill in MONGODB_URI, ADMIN_PASSWORD, JWT_SECRET
npm run dev

# 2. Frontend (in a second terminal)
cd roktodata-frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```

See [`roktodata-backend/README.md`](roktodata-backend/README.md) for the API reference and security notes.
