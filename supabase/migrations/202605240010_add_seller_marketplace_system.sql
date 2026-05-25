alter table public.marketplace_agents
  add column if not exists revenue_share_type text not null default 'platform_owned'
    check (
      revenue_share_type in (
        'platform_owned',
        'third_party_standard',
        'creator_referral',
        'custom_service_order'
      )
    ),
  add column if not exists creator_revenue_rate numeric(5, 4) not null default 0,
  add column if not exists platform_commission_rate numeric(5, 4) not null default 1;

update public.marketplace_agents
set
  revenue_share_type = 'third_party_standard',
  creator_revenue_rate = 0.7,
  platform_commission_rate = 0.3
where owner_type = 'seller'
  and revenue_share_type = 'platform_owned';

create table if not exists public.seller_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(id) on delete cascade,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USD'
    check (currency in ('USD', 'CNY')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_payouts_seller_id_idx on public.seller_payouts(seller_id);
create index if not exists seller_payouts_status_idx on public.seller_payouts(status);

drop trigger if exists set_seller_payouts_updated_at on public.seller_payouts;
create trigger set_seller_payouts_updated_at
before update on public.seller_payouts
for each row execute function public.set_updated_at();

alter table public.seller_payouts enable row level security;

grant all on public.seller_payouts to authenticated;

drop policy if exists "Admin manage seller payouts" on public.seller_payouts;
create policy "Admin manage seller payouts"
on public.seller_payouts for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Sellers read own payouts" on public.seller_payouts;
create policy "Sellers read own payouts"
on public.seller_payouts for select
to authenticated
using (
  exists (
    select 1
    from public.seller_profiles
    where seller_profiles.id = seller_payouts.seller_id
      and seller_profiles.user_id = auth.uid()
  )
);
