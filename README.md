# Business Ideas App

A sleek, high-tech web app for paid business-idea submissions.

## Stack

- Next.js (App Router)
- Clerk (auth)
- Stripe Checkout + webhooks (payments)
- Supabase Postgres (database, RLS)
- Vercel (hosting)

## Product Summary

- Users submit ideas for `$1` each.
- Ideas are private.
- Users can only see their own ideas and messages.
- Admin can review all ideas and approve/reject.
- Rejections require a reason and trigger an admin message.
- Approvals trigger an automatic "initially screened" message.
- Users cannot initiate chat in this MVP.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy envs:

```bash
cp .env.example .env.local
```

3. Start dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Important

- Payment verification must happen in Stripe webhook before marking an idea as paid/submitted.
- Replace mock data/services with real Supabase + Clerk in production.
- See `docs/IMPLEMENTATION_PLAN.md` and `db/schema.sql`.
- Admin access is controlled by Clerk `publicMetadata.role = "admin"` or by listing emails in `ADMIN_EMAILS` in `.env.local`.
