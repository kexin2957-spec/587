create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null
    check (actor_type in ('buyer', 'seller', 'admin', 'customer', 'system')),
  actor_id text,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx
  on public.audit_logs(actor_type, actor_id);

create index if not exists audit_logs_resource_idx
  on public.audit_logs(resource_type, resource_id);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

grant insert on public.audit_logs to authenticated;
grant select on public.audit_logs to authenticated;

drop policy if exists "Admin read audit logs" on public.audit_logs;
create policy "Admin read audit logs"
on public.audit_logs for select
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "Authenticated insert own audit events" on public.audit_logs;
create policy "Authenticated insert own audit events"
on public.audit_logs for insert
to authenticated
with check (
  public.current_user_role() in ('buyer', 'seller', 'admin')
);

drop policy if exists "Admin manage audit logs" on public.audit_logs;
create policy "Admin manage audit logs"
on public.audit_logs for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
