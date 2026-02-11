create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  summary text not null,
  details text not null,
  status text not null default 'draft' check (status in ('draft', 'payment_pending', 'submitted', 'approved_initial', 'rejected')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_reviews (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  admin_id uuid not null references public.users(id),
  decision text not null check (decision in ('approve', 'reject')),
  reason text,
  decided_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  from_admin boolean not null default true,
  body text not null,
  template_key text not null default 'custom',
  sent_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  stripe_session_id text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  status text not null check (status in ('pending', 'paid', 'failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.profit_share_agreements (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  percent numeric(5,2) not null default 10.00 check (percent > 0 and percent <= 100),
  terms_version text not null,
  accepted_at timestamptz not null default now()
);
