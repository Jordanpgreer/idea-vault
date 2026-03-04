alter table public.ideas
add column if not exists review_started_at timestamptz;

create index if not exists idx_ideas_review_started_at on public.ideas(review_started_at);
