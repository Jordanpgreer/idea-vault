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

alter table public.users enable row level security;
alter table public.ideas enable row level security;
alter table public.messages enable row level security;
alter table public.idea_reviews enable row level security;
alter table public.payments enable row level security;

drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
for select using (clerk_user_id = auth.jwt() ->> 'sub');

drop policy if exists ideas_select_own_or_admin on public.ideas;
create policy ideas_select_own_or_admin on public.ideas
for select using (
  submitter_id in (
    select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'
  )
  or exists (
    select 1 from public.users
    where clerk_user_id = auth.jwt() ->> 'sub' and role = 'admin'
  )
);

drop policy if exists ideas_insert_own on public.ideas;
create policy ideas_insert_own on public.ideas
for insert with check (
  submitter_id in (
    select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'
  )
);

drop policy if exists messages_select_related_idea on public.messages;
create policy messages_select_related_idea on public.messages
for select using (
  exists (
    select 1
    from public.ideas i
    join public.users u on u.id = i.submitter_id
    where i.id = messages.idea_id and u.clerk_user_id = auth.jwt() ->> 'sub'
  )
  or exists (
    select 1 from public.users
    where clerk_user_id = auth.jwt() ->> 'sub' and role = 'admin'
  )
);
