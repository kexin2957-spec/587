create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  agent_id uuid not null references public.marketplace_agents(id) on delete restrict,
  agent_slug text,
  plan_id text not null
    check (plan_id in ('agent_only', 'agent_setup', 'custom_version')),
  plan_name text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  company_name text,
  website_url text,
  message text,
  amount_usd numeric(12, 2),
  amount_cny numeric(12, 2),
  currency text not null default 'USD'
    check (currency in ('USD', 'CNY')),
  payment_method text not null default 'manual'
    check (
      payment_method in (
        'manual',
        'stripe',
        'paypal',
        'wechat',
        'alipay',
        'bank_transfer',
        'other'
      )
    ),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  order_status text not null default 'new'
    check (
      order_status in (
        'new',
        'contacted',
        'paid',
        'in_setup',
        'delivered',
        'completed',
        'cancelled'
      )
    ),
  delivery_status text not null default 'not_started'
    check (delivery_status in ('not_started', 'preparing', 'delivered')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paypal_order_id text,
  payment_link_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_agent_id_idx on public.orders(agent_id);
create index if not exists orders_agent_slug_idx on public.orders(agent_slug);
create index if not exists orders_customer_email_idx on public.orders(customer_email);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
create index if not exists orders_order_status_idx on public.orders(order_status);
create index if not exists orders_delivery_status_idx on public.orders(delivery_status);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists order_notes_order_id_idx on public.order_notes(order_id);

create table if not exists public.delivery_packages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  agent_id uuid not null references public.marketplace_agents(id) on delete restrict,
  customer_dashboard_url text,
  hosted_agent_url text,
  embed_code text,
  documentation_url text,
  delivery_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_packages_agent_id_idx on public.delivery_packages(agent_id);

drop trigger if exists set_delivery_packages_updated_at on public.delivery_packages;
create trigger set_delivery_packages_updated_at
before update on public.delivery_packages
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_notes enable row level security;
alter table public.delivery_packages enable row level security;

grant insert on public.orders to anon, authenticated;
grant all on public.orders to authenticated;
grant all on public.order_notes to authenticated;
grant all on public.delivery_packages to authenticated;

drop policy if exists "Public create orders" on public.orders;
create policy "Public create orders"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Admin manage orders" on public.orders;
create policy "Admin manage orders"
on public.orders for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Admin manage order notes" on public.order_notes;
create policy "Admin manage order notes"
on public.order_notes for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Admin manage delivery packages" on public.delivery_packages;
create policy "Admin manage delivery packages"
on public.delivery_packages for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
