alter table public.users enable row level security;
alter table public.ideas enable row level security;
alter table public.messages enable row level security;
alter table public.idea_reviews enable row level security;
alter table public.payments enable row level security;
alter table public.profit_share_agreements enable row level security;

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
