alter table public.purchase_requests
  add column if not exists agent_slug text,
  add column if not exists preferred_contact_method text,
  add column if not exists website_url text,
  add column if not exists setup_needs text,
  add column if not exists timeline text,
  add column if not exists what_should_be_customized text,
  add column if not exists required_integrations text,
  add column if not exists source_page text,
  add column if not exists language text,
  add column if not exists admin_note text;

create index if not exists purchase_requests_agent_slug_idx
  on public.purchase_requests(agent_slug);

create index if not exists purchase_requests_source_page_idx
  on public.purchase_requests(source_page);

alter table public.custom_requests
  add column if not exists source_page text,
  add column if not exists language text,
  add column if not exists admin_note text;

create index if not exists custom_requests_source_page_idx
  on public.custom_requests(source_page);
