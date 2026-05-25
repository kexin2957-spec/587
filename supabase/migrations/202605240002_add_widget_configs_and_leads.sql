create table if not exists public.customer_agent_configs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  agent_id uuid references public.marketplace_agents(id) on delete set null,
  agent_slug text not null,
  business_name text not null default 'Demo Business',
  welcome_message text not null default 'Hi, how can we help you today?',
  primary_color text not null default '#2563eb',
  widget_position text not null default 'bottom_right'
    check (widget_position in ('bottom_right', 'bottom_left')),
  avatar_url text,
  offline_message text not null default 'Leave your contact details and our team will follow up soon.',
  contact_email text not null default '',
  business_hours text,
  company_introduction text not null default '',
  services_products text not null default '',
  faq jsonb not null default '[]'::jsonb,
  pricing_ranges text,
  contact_information text,
  disallowed_claims text,
  handoff_rules text,
  custom_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_agent_configs_order_id_idx
  on public.customer_agent_configs(order_id);
create index if not exists customer_agent_configs_order_number_idx
  on public.customer_agent_configs(order_number);
create index if not exists customer_agent_configs_agent_slug_idx
  on public.customer_agent_configs(agent_slug);

drop trigger if exists set_customer_agent_configs_updated_at on public.customer_agent_configs;
create trigger set_customer_agent_configs_updated_at
before update on public.customer_agent_configs
for each row execute function public.set_updated_at();

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.marketplace_agents(id) on delete set null,
  agent_slug text not null,
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  customer_config_id uuid references public.customer_agent_configs(id) on delete set null,
  visitor_name text not null,
  visitor_email text not null,
  visitor_phone text,
  visitor_company text,
  inquiry text not null,
  intent text not null default 'unknown'
    check (
      intent in (
        'service_inquiry',
        'pricing_inquiry',
        'booking_request',
        'support_question',
        'sales_lead',
        'custom_project_request',
        'human_handoff',
        'unknown'
      )
    ),
  lead_score text not null default 'cold'
    check (lead_score in ('hot', 'warm', 'cold', 'invalid')),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'won', 'lost', 'invalid')),
  conversation_summary text not null default '',
  transcript jsonb not null default '[]'::jsonb,
  needs_human boolean not null default false,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_agent_slug_idx on public.leads(agent_slug);
create index if not exists leads_order_id_idx on public.leads(order_id);
create index if not exists leads_order_number_idx on public.leads(order_number);
create index if not exists leads_customer_config_id_idx on public.leads(customer_config_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_score_idx on public.leads(lead_score);

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

alter table public.customer_agent_configs enable row level security;
alter table public.leads enable row level security;

grant select on public.customer_agent_configs to anon, authenticated;
grant insert on public.leads to anon, authenticated;
grant all on public.customer_agent_configs to authenticated;
grant all on public.leads to authenticated;

drop policy if exists "Public read customer agent configs" on public.customer_agent_configs;
create policy "Public read customer agent configs"
on public.customer_agent_configs for select
to anon, authenticated
using (true);

drop policy if exists "Admin manage customer agent configs" on public.customer_agent_configs;
create policy "Admin manage customer agent configs"
on public.customer_agent_configs for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public submit leads" on public.leads;
create policy "Public submit leads"
on public.leads for insert
to anon, authenticated
with check (true);

drop policy if exists "Admin manage leads" on public.leads;
create policy "Admin manage leads"
on public.leads for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
