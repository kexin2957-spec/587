create table if not exists public.media_account_report_generation_quotas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_date date not null,
  generation_count integer not null default 0 check (generation_count >= 0),
  reserved_count integer not null default 0 check (reserved_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, generation_date)
);

create index if not exists media_account_report_generation_quotas_user_date_idx
  on public.media_account_report_generation_quotas(user_id, generation_date);

drop trigger if exists set_media_account_report_generation_quotas_updated_at
  on public.media_account_report_generation_quotas;
create trigger set_media_account_report_generation_quotas_updated_at
before update on public.media_account_report_generation_quotas
for each row execute function public.set_updated_at();

alter table public.media_account_report_generation_quotas enable row level security;

grant select on public.media_account_report_generation_quotas to authenticated;

drop policy if exists "Users read own media account report quota"
  on public.media_account_report_generation_quotas;
create policy "Users read own media account report quota"
on public.media_account_report_generation_quotas for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

create or replace function public.get_media_account_report_quota(
  p_user_id uuid,
  p_generation_date date default current_date,
  p_limit integer default 5
)
returns table (
  generation_date date,
  generation_count integer,
  reserved_count integer,
  limit_count integer,
  remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.media_account_report_generation_quotas (user_id, generation_date)
  values (p_user_id, p_generation_date)
  on conflict (user_id, generation_date) do nothing;

  return query
  select
    q.generation_date,
    q.generation_count,
    q.reserved_count,
    p_limit,
    greatest(0, p_limit - q.generation_count - q.reserved_count)
  from public.media_account_report_generation_quotas q
  where q.user_id = p_user_id
    and q.generation_date = p_generation_date;
end;
$$;

create or replace function public.reserve_media_account_report_generation(
  p_user_id uuid,
  p_generation_date date default current_date,
  p_limit integer default 5
)
returns table (
  allowed boolean,
  generation_date date,
  generation_count integer,
  reserved_count integer,
  limit_count integer,
  remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.media_account_report_generation_quotas (user_id, generation_date)
  values (p_user_id, p_generation_date)
  on conflict (user_id, generation_date) do nothing;

  return query
  with updated as (
    update public.media_account_report_generation_quotas q
    set reserved_count = q.reserved_count + 1
    where q.user_id = p_user_id
      and q.generation_date = p_generation_date
      and q.generation_count + q.reserved_count < p_limit
    returning q.generation_date, q.generation_count, q.reserved_count
  )
  select
    true,
    u.generation_date,
    u.generation_count,
    u.reserved_count,
    p_limit,
    greatest(0, p_limit - u.generation_count - u.reserved_count)
  from updated u;

  if not found then
    return query
    select
      false,
      q.generation_date,
      q.generation_count,
      q.reserved_count,
      p_limit,
      greatest(0, p_limit - q.generation_count - q.reserved_count)
    from public.media_account_report_generation_quotas q
    where q.user_id = p_user_id
      and q.generation_date = p_generation_date;
  end if;
end;
$$;

create or replace function public.complete_media_account_report_generation(
  p_user_id uuid,
  p_generation_date date default current_date,
  p_limit integer default 5
)
returns table (
  generation_date date,
  generation_count integer,
  reserved_count integer,
  limit_count integer,
  remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.media_account_report_generation_quotas q
  set
    reserved_count = greatest(0, q.reserved_count - 1),
    generation_count = least(p_limit, q.generation_count + 1)
  where q.user_id = p_user_id
    and q.generation_date = p_generation_date
  returning
    q.generation_date,
    q.generation_count,
    q.reserved_count,
    p_limit,
    greatest(0, p_limit - q.generation_count - q.reserved_count);
end;
$$;

create or replace function public.release_media_account_report_generation(
  p_user_id uuid,
  p_generation_date date default current_date,
  p_limit integer default 5
)
returns table (
  generation_date date,
  generation_count integer,
  reserved_count integer,
  limit_count integer,
  remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.media_account_report_generation_quotas q
  set reserved_count = greatest(0, q.reserved_count - 1)
  where q.user_id = p_user_id
    and q.generation_date = p_generation_date
  returning
    q.generation_date,
    q.generation_count,
    q.reserved_count,
    p_limit,
    greatest(0, p_limit - q.generation_count - q.reserved_count);
end;
$$;

revoke all on function public.get_media_account_report_quota(uuid, date, integer)
  from public, anon, authenticated;
revoke all on function public.reserve_media_account_report_generation(uuid, date, integer)
  from public, anon, authenticated;
revoke all on function public.complete_media_account_report_generation(uuid, date, integer)
  from public, anon, authenticated;
revoke all on function public.release_media_account_report_generation(uuid, date, integer)
  from public, anon, authenticated;

grant execute on function public.get_media_account_report_quota(uuid, date, integer)
  to service_role;
grant execute on function public.reserve_media_account_report_generation(uuid, date, integer)
  to service_role;
grant execute on function public.complete_media_account_report_generation(uuid, date, integer)
  to service_role;
grant execute on function public.release_media_account_report_generation(uuid, date, integer)
  to service_role;
