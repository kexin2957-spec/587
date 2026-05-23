create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'buyer'
    check (role in ('buyer', 'seller', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_role_idx on public.profiles(role);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email, ''),
    'buyer'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid() limit 1;
$$;

grant execute on function public.current_user_role() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.agent_categories enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.seller_applications enable row level security;
alter table public.marketplace_agents enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.custom_requests enable row level security;
alter table public.agent_reviews enable row level security;
alter table public.agent_review_notes enable row level security;

grant select on public.agent_categories to anon, authenticated;
grant select on public.marketplace_agents to anon, authenticated;
grant insert on public.purchase_requests to anon, authenticated;
grant insert on public.custom_requests to anon, authenticated;
grant insert on public.seller_applications to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert on public.profiles to authenticated;
grant all on public.profiles to authenticated;
grant all on public.agent_categories to authenticated;
grant all on public.seller_profiles to authenticated;
grant all on public.seller_applications to authenticated;
grant all on public.marketplace_agents to authenticated;
grant all on public.purchase_requests to authenticated;
grant all on public.custom_requests to authenticated;
grant all on public.agent_reviews to authenticated;
grant all on public.agent_review_notes to authenticated;

drop policy if exists "Profiles read own" on public.profiles;
create policy "Profiles read own"
on public.profiles for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "Profiles insert own buyer profile" on public.profiles;
create policy "Profiles insert own buyer profile"
on public.profiles for insert
to authenticated
with check (user_id = auth.uid() and role = 'buyer');

drop policy if exists "Profiles admin manage all" on public.profiles;
create policy "Profiles admin manage all"
on public.profiles for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public read categories" on public.agent_categories;
create policy "Public read categories"
on public.agent_categories for select
to anon, authenticated
using (true);

drop policy if exists "Admin manage categories" on public.agent_categories;
create policy "Admin manage categories"
on public.agent_categories for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Users read own seller profile" on public.seller_profiles;
create policy "Users read own seller profile"
on public.seller_profiles for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "Admin manage seller profiles" on public.seller_profiles;
create policy "Admin manage seller profiles"
on public.seller_profiles for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public submit seller applications" on public.seller_applications;
create policy "Public submit seller applications"
on public.seller_applications for insert
to anon, authenticated
with check (true);

drop policy if exists "Admin manage seller applications" on public.seller_applications;
create policy "Admin manage seller applications"
on public.seller_applications for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public read approved agents" on public.marketplace_agents;
create policy "Public read approved agents"
on public.marketplace_agents for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Sellers read own agents" on public.marketplace_agents;
create policy "Sellers read own agents"
on public.marketplace_agents for select
to authenticated
using (
  exists (
    select 1 from public.seller_profiles
    where seller_profiles.id = marketplace_agents.seller_id
      and seller_profiles.user_id = auth.uid()
  )
  or public.current_user_role() = 'admin'
);

drop policy if exists "Approved sellers submit own agents" on public.marketplace_agents;
create policy "Approved sellers submit own agents"
on public.marketplace_agents for insert
to authenticated
with check (
  owner_type = 'seller'
  and status in ('draft', 'submitted')
  and is_featured = false
  and is_verified = false
  and exists (
    select 1 from public.seller_profiles
    where seller_profiles.id = marketplace_agents.seller_id
      and seller_profiles.user_id = auth.uid()
      and seller_profiles.status = 'approved'
  )
);

drop policy if exists "Sellers update own nonpublic agents" on public.marketplace_agents;
create policy "Sellers update own nonpublic agents"
on public.marketplace_agents for update
to authenticated
using (
  owner_type = 'seller'
  and status in ('draft', 'submitted', 'needs_changes')
  and exists (
    select 1 from public.seller_profiles
    where seller_profiles.id = marketplace_agents.seller_id
      and seller_profiles.user_id = auth.uid()
      and seller_profiles.status = 'approved'
  )
)
with check (
  owner_type = 'seller'
  and status in ('draft', 'submitted', 'needs_changes')
  and is_featured = false
  and is_verified = false
);

drop policy if exists "Admin manage all agents" on public.marketplace_agents;
create policy "Admin manage all agents"
on public.marketplace_agents for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public submit purchase requests" on public.purchase_requests;
create policy "Public submit purchase requests"
on public.purchase_requests for insert
to anon, authenticated
with check (true);

drop policy if exists "Admin manage purchase requests" on public.purchase_requests;
create policy "Admin manage purchase requests"
on public.purchase_requests for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public submit custom requests" on public.custom_requests;
create policy "Public submit custom requests"
on public.custom_requests for insert
to anon, authenticated
with check (true);

drop policy if exists "Admin manage custom requests" on public.custom_requests;
create policy "Admin manage custom requests"
on public.custom_requests for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public read approved reviews" on public.agent_reviews;
create policy "Public read approved reviews"
on public.agent_reviews for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Public submit pending reviews" on public.agent_reviews;
create policy "Public submit pending reviews"
on public.agent_reviews for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "Admin manage reviews" on public.agent_reviews;
create policy "Admin manage reviews"
on public.agent_reviews for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Admin manage review notes" on public.agent_review_notes;
create policy "Admin manage review notes"
on public.agent_review_notes for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
