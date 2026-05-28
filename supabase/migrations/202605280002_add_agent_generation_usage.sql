create table if not exists public.agent_generation_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_slug text not null,
  usage_date date not null,
  generation_count integer not null default 0 check (generation_count >= 0),
  reserved_count integer not null default 0 check (reserved_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, agent_slug, usage_date)
);

create index if not exists agent_generation_usage_user_agent_date_idx
  on public.agent_generation_usage(user_id, agent_slug, usage_date);

create index if not exists agent_generation_usage_agent_date_idx
  on public.agent_generation_usage(agent_slug, usage_date);

drop trigger if exists set_agent_generation_usage_updated_at
  on public.agent_generation_usage;
create trigger set_agent_generation_usage_updated_at
before update on public.agent_generation_usage
for each row execute function public.set_updated_at();

alter table public.agent_generation_usage enable row level security;

grant select on public.agent_generation_usage to authenticated;

drop policy if exists "Users read own agent generation usage"
  on public.agent_generation_usage;
create policy "Users read own agent generation usage"
on public.agent_generation_usage for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

create or replace function public.get_agent_generation_usage(
  p_user_id uuid,
  p_agent_slug text,
  p_usage_date date default current_date,
  p_limit integer default 5
)
returns table (
  usage_date date,
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
  insert into public.agent_generation_usage (user_id, agent_slug, usage_date)
  values (p_user_id, p_agent_slug, p_usage_date)
  on conflict (user_id, agent_slug, usage_date) do nothing;

  return query
  select
    usage.usage_date,
    usage.generation_count,
    usage.reserved_count,
    p_limit,
    greatest(0, p_limit - usage.generation_count - usage.reserved_count)
  from public.agent_generation_usage usage
  where usage.user_id = p_user_id
    and usage.agent_slug = p_agent_slug
    and usage.usage_date = p_usage_date;
end;
$$;

create or replace function public.reserve_agent_generation(
  p_user_id uuid,
  p_agent_slug text,
  p_usage_date date default current_date,
  p_limit integer default 5
)
returns table (
  allowed boolean,
  usage_date date,
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
  insert into public.agent_generation_usage (user_id, agent_slug, usage_date)
  values (p_user_id, p_agent_slug, p_usage_date)
  on conflict (user_id, agent_slug, usage_date) do nothing;

  return query
  with updated as (
    update public.agent_generation_usage usage
    set reserved_count = usage.reserved_count + 1
    where usage.user_id = p_user_id
      and usage.agent_slug = p_agent_slug
      and usage.usage_date = p_usage_date
      and usage.generation_count + usage.reserved_count < p_limit
    returning usage.usage_date, usage.generation_count, usage.reserved_count
  )
  select
    true,
    updated.usage_date,
    updated.generation_count,
    updated.reserved_count,
    p_limit,
    greatest(0, p_limit - updated.generation_count - updated.reserved_count)
  from updated;

  if not found then
    return query
    select
      false,
      usage.usage_date,
      usage.generation_count,
      usage.reserved_count,
      p_limit,
      greatest(0, p_limit - usage.generation_count - usage.reserved_count)
    from public.agent_generation_usage usage
    where usage.user_id = p_user_id
      and usage.agent_slug = p_agent_slug
      and usage.usage_date = p_usage_date;
  end if;
end;
$$;

create or replace function public.complete_agent_generation(
  p_user_id uuid,
  p_agent_slug text,
  p_usage_date date default current_date,
  p_limit integer default 5
)
returns table (
  usage_date date,
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
  update public.agent_generation_usage usage
  set
    reserved_count = greatest(0, usage.reserved_count - 1),
    generation_count = least(p_limit, usage.generation_count + 1)
  where usage.user_id = p_user_id
    and usage.agent_slug = p_agent_slug
    and usage.usage_date = p_usage_date
  returning
    usage.usage_date,
    usage.generation_count,
    usage.reserved_count,
    p_limit,
    greatest(0, p_limit - usage.generation_count - usage.reserved_count);
end;
$$;

create or replace function public.release_agent_generation(
  p_user_id uuid,
  p_agent_slug text,
  p_usage_date date default current_date,
  p_limit integer default 5
)
returns table (
  usage_date date,
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
  update public.agent_generation_usage usage
  set reserved_count = greatest(0, usage.reserved_count - 1)
  where usage.user_id = p_user_id
    and usage.agent_slug = p_agent_slug
    and usage.usage_date = p_usage_date
  returning
    usage.usage_date,
    usage.generation_count,
    usage.reserved_count,
    p_limit,
    greatest(0, p_limit - usage.generation_count - usage.reserved_count);
end;
$$;

revoke all on function public.get_agent_generation_usage(uuid, text, date, integer)
  from public, anon, authenticated;
revoke all on function public.reserve_agent_generation(uuid, text, date, integer)
  from public, anon, authenticated;
revoke all on function public.complete_agent_generation(uuid, text, date, integer)
  from public, anon, authenticated;
revoke all on function public.release_agent_generation(uuid, text, date, integer)
  from public, anon, authenticated;

grant execute on function public.get_agent_generation_usage(uuid, text, date, integer)
  to service_role;
grant execute on function public.reserve_agent_generation(uuid, text, date, integer)
  to service_role;
grant execute on function public.complete_agent_generation(uuid, text, date, integer)
  to service_role;
grant execute on function public.release_agent_generation(uuid, text, date, integer)
  to service_role;
