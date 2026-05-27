alter table public.seller_applications
  add column if not exists seller_terms_agreed boolean not null default false,
  add column if not exists originality_confirmed boolean not null default false;

alter table public.seller_applications
  drop constraint if exists seller_applications_status_check;

alter table public.seller_applications
  add constraint seller_applications_status_check
  check (status in ('submitted', 'in_review', 'approved', 'rejected', 'suspended'));

create index if not exists seller_applications_email_idx
on public.seller_applications(email);

create index if not exists seller_profiles_email_idx
on public.seller_profiles(email);
