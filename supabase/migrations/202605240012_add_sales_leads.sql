create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  business_type text not null,
  website text not null,
  desired_agent_function text not null,
  budget_range text not null,
  timeline text not null,
  contact_method text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  source_channel text,
  salesperson_code text,
  customer_type text,
  interest_level text,
  notes text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'invalid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_leads_created_at_idx
  on public.sales_leads (created_at desc);

create index if not exists sales_leads_source_channel_idx
  on public.sales_leads (source_channel);

create index if not exists sales_leads_salesperson_code_idx
  on public.sales_leads (salesperson_code);
