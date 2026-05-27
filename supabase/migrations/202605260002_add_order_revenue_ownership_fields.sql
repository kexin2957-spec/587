alter table public.orders
  add column if not exists amount numeric(12, 2),
  add column if not exists owner_type text not null default 'platform',
  add column if not exists seller_id uuid references public.seller_profiles(id) on delete set null,
  add column if not exists seller_email text,
  add column if not exists seller_name text,
  add column if not exists platform_commission_rate numeric(5, 4) not null default 1,
  add column if not exists seller_revenue_rate numeric(5, 4) not null default 0,
  add column if not exists platform_fee_amount numeric(12, 2) not null default 0,
  add column if not exists seller_revenue_amount numeric(12, 2) not null default 0,
  add column if not exists payout_status text not null default 'pending';

alter table public.orders
  drop constraint if exists orders_owner_type_check;

alter table public.orders
  add constraint orders_owner_type_check
  check (owner_type in ('platform', 'seller'));

alter table public.orders
  drop constraint if exists orders_payout_status_check;

alter table public.orders
  add constraint orders_payout_status_check
  check (payout_status in ('pending', 'eligible', 'paid', 'cancelled'));

update public.orders
set
  amount = coalesce(
    amount,
    case
      when currency = 'CNY' then amount_cny
      else amount_usd
    end
  ),
  owner_type = coalesce(owner_type, 'platform'),
  platform_commission_rate = coalesce(platform_commission_rate, 1),
  seller_revenue_rate = coalesce(seller_revenue_rate, 0),
  platform_fee_amount = coalesce(
    platform_fee_amount,
    case
      when currency = 'CNY' then amount_cny
      else amount_usd
    end,
    0
  ),
  seller_revenue_amount = coalesce(seller_revenue_amount, 0),
  payout_status = coalesce(payout_status, 'pending');

create index if not exists orders_seller_id_idx on public.orders(seller_id);
create index if not exists orders_owner_type_idx on public.orders(owner_type);
create index if not exists orders_payout_status_idx on public.orders(payout_status);

alter table public.seller_payouts
  drop constraint if exists seller_payouts_status_check;

alter table public.seller_payouts
  add constraint seller_payouts_status_check
  check (status in ('pending', 'eligible', 'processing', 'paid', 'cancelled'));
