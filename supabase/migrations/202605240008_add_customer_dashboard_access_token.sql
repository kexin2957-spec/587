alter table public.delivery_packages
  add column if not exists customer_access_token text;

create index if not exists delivery_packages_customer_access_token_idx
  on public.delivery_packages(customer_access_token);
