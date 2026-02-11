create index if not exists idx_users_clerk_user_id on public.users(clerk_user_id);
create index if not exists idx_ideas_submitter_created on public.ideas(submitter_id, created_at desc);
create index if not exists idx_ideas_status on public.ideas(status);
create index if not exists idx_messages_idea_sent_at on public.messages(idea_id, sent_at desc);
create index if not exists idx_reviews_idea_decided_at on public.idea_reviews(idea_id, decided_at desc);
create index if not exists idx_payments_idea_created on public.payments(idea_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ideas_updated_at on public.ideas;
create trigger trg_ideas_updated_at
before update on public.ideas
for each row execute function public.set_updated_at();
