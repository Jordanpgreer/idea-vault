# Business Ideas App

A sleek, high-tech web app for paid business-idea submissions.

## Stack

- Next.js (App Router)
- Clerk (auth)
- Stripe Checkout + webhooks (payments)
- Supabase Postgres (database, RLS)
- Vercel (hosting)

## Product Summary

- Users can submit ideas via:
  - `$1` one-time checkout per idea, or
  - monthly subscriptions:
    - `$3/month` for 5 ideas
    - `$5/month` for 8 ideas
- Monthly subscription idea limits reset each month and do not roll over.
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
- Configure Stripe recurring price ids in `.env.local`:
  - `STRIPE_SUB_PRICE_5_ID`
  - `STRIPE_SUB_PRICE_8_ID`
- Replace mock data/services with real Supabase + Clerk in production.
- See `docs/IMPLEMENTATION_PLAN.md` and `db/schema.sql`.
- Admin access is controlled by Clerk `publicMetadata.role = "admin"` or by listing emails in `ADMIN_EMAILS` in `.env.local`.
