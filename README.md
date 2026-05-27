# Freelance CRM

Next.js + Firebase PWA for customers, pipeline, projects, payments, follow-ups, documents, and reports.

## Setup

1. Copy `.env.local.example` to `.env.local`.
2. Fill the Firebase web app config values.
3. Enable Firebase Authentication providers: Email/Password and Google.
4. Create Firestore Database and Firebase Storage.
5. Deploy or copy `firestore.rules` and `storage.rules` into Firebase rules.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Vercel Deploy

Use these settings when importing the GitHub repository into Vercel:

- Framework Preset: `Next.js`
- Root Directory: leave empty / repository root
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave empty
- Production Branch: `main`

Add the same Firebase variables from `.env.local.example` in Vercel Project Settings > Environment Variables before deploying production.

If the deployment returns `404: NOT_FOUND`, check that Output Directory is not set to `out`, `.next`, or `dist`, then redeploy the latest commit from `main`.

## Data Path

All user data is stored under:

```text
users/{userId}/customers
users/{userId}/leads
users/{userId}/projects
users/{userId}/payments
users/{userId}/followups
users/{userId}/documents
```
