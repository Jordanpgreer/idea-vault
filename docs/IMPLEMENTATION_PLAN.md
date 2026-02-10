# Implementation Plan

## Phase 1: Product Skeleton (Complete)

- Next.js app scaffold
- High-tech black/silver UI direction
- Core pages:
  - Landing
  - User dashboard
  - Idea submit
  - Messages
  - Admin review queue
- API scaffolding:
  - Create idea draft
  - Create Stripe checkout session
  - Stripe webhook handler
  - Admin approve/reject endpoint
- Supabase schema + baseline RLS policies

## Phase 2: Real Integrations

- Clerk auth wiring with current user and role checks
- Supabase repository layer replacing in-memory mock data
- Stripe flow:
  - Create checkout session after draft save
  - Update payment + idea status on webhook
  - Idempotency and retries
- Admin notification persistence:
  - Insert messages on approve/reject
  - Enforce rejection reason on server

## Phase 3: Production Hardening

- RLS policy review and automated tests
- Input validation (Zod) and shared DTOs
- API rate limits and abuse controls
- Audit logs for admin actions
- Observability and alerts (Vercel + Supabase logs)

## Phase 4: Controlled User Reply (Optional)

- Keep default no-chat behavior
- Enable restricted follow-up only for ideas in approved status
- Add cooldown and message caps

## Notes

- `$1` price point is intentionally kept for now and can be changed by editing `ideaPriceInCents` in `lib/config.ts`.
- Terms and payout logic for 10% profit share must be finalized before public launch.
