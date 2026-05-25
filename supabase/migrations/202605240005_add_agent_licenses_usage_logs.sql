create table if not exists public.agent_licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text not null unique,
  order_id uuid not null references public.orders(id) on delete cascade,
  agent_id uuid not null references public.marketplace_agents(id) on delete restrict,
  customer_email text not null,
  customer_name text not null,
  allowed_domains text[] not null default '{}'::text[],
  status text not null default 'inactive'
    check (status in ('active', 'inactive', 'suspended', 'expired')),
  plan_name text not null,
  usage_limit_monthly integer,
  usage_count_monthly integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (
    payment_status in (
      'pending',
      'paid',
      'manually_approved',
      'failed',
      'refunded',
      'cancelled'
    )
  );

create index if not exists agent_licenses_order_id_idx
  on public.agent_licenses(order_id);

create index if not exists agent_licenses_agent_id_idx
  on public.agent_licenses(agent_id);

create index if not exists agent_licenses_status_idx
  on public.agent_licenses(status);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  license_id uuid references public.agent_licenses(id) on delete set null,
  agent_id uuid references public.marketplace_agents(id) on delete set null,
  domain text,
  event_type text not null
    check (
      event_type in (
        'widget_load',
        'chat_message',
        'lead_created',
        'blocked_domain',
        'license_error'
      )
    ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_logs_license_id_idx
  on public.usage_logs(license_id);

create index if not exists usage_logs_agent_id_idx
  on public.usage_logs(agent_id);

create index if not exists usage_logs_event_type_idx
  on public.usage_logs(event_type);

create index if not exists usage_logs_created_at_idx
  on public.usage_logs(created_at);

drop trigger if exists set_agent_licenses_updated_at on public.agent_licenses;
create trigger set_agent_licenses_updated_at
before update on public.agent_licenses
for each row execute function public.set_updated_at();

alter table public.agent_licenses enable row level security;
alter table public.usage_logs enable row level security;

grant all on public.agent_licenses to authenticated;
grant all on public.usage_logs to authenticated;

drop policy if exists "Admin manage agent licenses" on public.agent_licenses;
create policy "Admin manage agent licenses"
on public.agent_licenses for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admin read usage logs" on public.usage_logs;
create policy "Admin read usage logs"
on public.usage_logs for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admin insert usage logs" on public.usage_logs;
create policy "Admin insert usage logs"
on public.usage_logs for insert
to authenticated
with check (public.is_admin(auth.uid()));
