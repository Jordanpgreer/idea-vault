alter table public.users
add column if not exists stripe_customer_id text unique;

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  plan_code text not null check (plan_code in ('starter_5', 'pro_8')),
  monthly_idea_limit integer not null check (monthly_idea_limit > 0),
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_monthly_quotas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  month_key text not null,
  submitted_count integer not null default 0 check (submitted_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_key)
);

create index if not exists idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_status on public.user_subscriptions(status);
create index if not exists idx_user_subscriptions_period_end on public.user_subscriptions(current_period_end);
create index if not exists idx_user_monthly_quotas_user_month on public.user_monthly_quotas(user_id, month_key);

drop trigger if exists trg_user_subscriptions_updated_at on public.user_subscriptions;
create trigger trg_user_subscriptions_updated_at
before update on public.user_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_monthly_quotas_updated_at on public.user_monthly_quotas;
create trigger trg_user_monthly_quotas_updated_at
before update on public.user_monthly_quotas
for each row execute function public.set_updated_at();
