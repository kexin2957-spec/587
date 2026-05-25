alter table public.delivery_packages
  add column if not exists license_key text,
  add column if not exists allowed_domains text[] not null default '{}'::text[];

create index if not exists delivery_packages_license_key_idx
  on public.delivery_packages(license_key);
