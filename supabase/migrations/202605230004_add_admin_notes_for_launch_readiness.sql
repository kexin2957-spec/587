alter table public.marketplace_agents
  add column if not exists admin_note text,
  add column if not exists review_feedback text;

alter table public.seller_applications
  add column if not exists admin_note text;
