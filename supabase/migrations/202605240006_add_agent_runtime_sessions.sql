create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.marketplace_agents(id) on delete set null,
  license_id uuid references public.agent_licenses(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  visitor_id text not null,
  source_url text,
  language text not null default 'en'
    check (language in ('en', 'zh')),
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  intent text,
  lead_score text check (lead_score in ('hot', 'warm', 'cold', 'invalid')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_sessions_agent_id_idx
  on public.agent_sessions(agent_id);

create index if not exists agent_sessions_license_id_idx
  on public.agent_sessions(license_id);

create index if not exists agent_sessions_order_id_idx
  on public.agent_sessions(order_id);

create index if not exists agent_sessions_last_message_at_idx
  on public.agent_sessions(last_message_at desc);

create index if not exists agent_messages_session_id_idx
  on public.agent_messages(session_id);

create index if not exists agent_messages_created_at_idx
  on public.agent_messages(created_at);

alter table public.agent_sessions enable row level security;
alter table public.agent_messages enable row level security;

grant all on public.agent_sessions to authenticated;
grant all on public.agent_messages to authenticated;

drop policy if exists "Admin manage agent sessions" on public.agent_sessions;
create policy "Admin manage agent sessions"
on public.agent_sessions for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admin manage agent messages" on public.agent_messages;
create policy "Admin manage agent messages"
on public.agent_messages for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
