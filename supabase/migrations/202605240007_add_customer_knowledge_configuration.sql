alter table public.customer_agent_configs
  add column if not exists license_id uuid references public.agent_licenses(id) on delete set null,
  add column if not exists customer_email text,
  add column if not exists website_url text,
  add column if not exists business_description text,
  add column if not exists services_or_products text,
  add column if not exists contact_phone text,
  add column if not exists brand_tone text,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'active', 'paused'));

update public.customer_agent_configs
set
  business_description = coalesce(business_description, company_introduction, ''),
  services_or_products = coalesce(services_or_products, services_products, ''),
  customer_email = coalesce(customer_email, contact_email, ''),
  website_url = coalesce(website_url, ''),
  brand_tone = coalesce(brand_tone, 'Professional, helpful, concise, and safe.'),
  status = coalesce(status, 'draft')
where
  business_description is null
  or services_or_products is null
  or customer_email is null
  or website_url is null
  or brand_tone is null;

create index if not exists customer_agent_configs_license_id_idx
  on public.customer_agent_configs(license_id);
create index if not exists customer_agent_configs_customer_email_idx
  on public.customer_agent_configs(customer_email);
create index if not exists customer_agent_configs_status_idx
  on public.customer_agent_configs(status);

create table if not exists public.customer_faq_items (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.customer_agent_configs(id) on delete cascade,
  question text not null,
  answer text not null,
  language text not null default 'en' check (language in ('en', 'zh')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_faq_items_config_id_idx
  on public.customer_faq_items(config_id);
create index if not exists customer_faq_items_language_idx
  on public.customer_faq_items(language);
create index if not exists customer_faq_items_is_active_idx
  on public.customer_faq_items(is_active);

drop trigger if exists set_customer_faq_items_updated_at on public.customer_faq_items;
create trigger set_customer_faq_items_updated_at
before update on public.customer_faq_items
for each row execute function public.set_updated_at();

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.customer_agent_configs(id) on delete cascade,
  title text not null,
  content text not null,
  document_type text not null default 'other'
    check (document_type in ('company_info', 'faq', 'services', 'products', 'policy', 'other')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_documents_config_id_idx
  on public.knowledge_documents(config_id);
create index if not exists knowledge_documents_document_type_idx
  on public.knowledge_documents(document_type);
create index if not exists knowledge_documents_is_active_idx
  on public.knowledge_documents(is_active);

drop trigger if exists set_knowledge_documents_updated_at on public.knowledge_documents;
create trigger set_knowledge_documents_updated_at
before update on public.knowledge_documents
for each row execute function public.set_updated_at();

alter table public.customer_faq_items enable row level security;
alter table public.knowledge_documents enable row level security;

grant select on public.customer_faq_items to anon, authenticated;
grant select on public.knowledge_documents to anon, authenticated;
grant all on public.customer_faq_items to authenticated;
grant all on public.knowledge_documents to authenticated;

drop policy if exists "Public read customer faq items" on public.customer_faq_items;
create policy "Public read customer faq items"
on public.customer_faq_items for select
to anon, authenticated
using (true);

drop policy if exists "Admin manage customer faq items" on public.customer_faq_items;
create policy "Admin manage customer faq items"
on public.customer_faq_items for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public read knowledge documents" on public.knowledge_documents;
create policy "Public read knowledge documents"
on public.knowledge_documents for select
to anon, authenticated
using (true);

drop policy if exists "Admin manage knowledge documents" on public.knowledge_documents;
create policy "Admin manage knowledge documents"
on public.knowledge_documents for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
