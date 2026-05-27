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
