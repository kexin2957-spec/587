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

alter table public.orders
  add column if not exists billing_interval text not null default 'one_time'
    check (billing_interval in ('one_time', 'monthly', 'yearly')),
  add column if not exists subscription_status text not null default 'not_required'
    check (
      subscription_status in (
        'not_required',
        'pending',
        'active',
        'past_due',
        'cancelled',
        'expired'
      )
    ),
  add column if not exists next_billing_date timestamptz,
  add column if not exists cancel_at timestamptz,
  add column if not exists payment_reference text,
  add column if not exists payment_proof_url text;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'manual'
    check (
      provider in (
        'manual',
        'stripe',
        'paypal',
        'wechat',
        'alipay',
        'bank_transfer'
      )
    ),
  provider_payment_id text,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USD'
    check (currency in ('USD', 'CNY')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_url text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payments_provider_idx on public.payments(provider);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_provider_payment_id_idx
  on public.payments(provider_payment_id);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

grant all on public.payments to authenticated;

drop policy if exists "Admin manage payments" on public.payments;
create policy "Admin manage payments"
on public.payments for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
