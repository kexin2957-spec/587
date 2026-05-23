create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.agent_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_zh text not null,
  description_en text not null default '',
  description_zh text not null default '',
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_agent_categories_updated_at
before update on public.agent_categories
for each row execute function public.set_updated_at();

create table public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  team_name text,
  email text not null,
  website text,
  expertise text,
  offers_custom_services boolean not null default false,
  payout_preference text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seller_profiles_user_id_idx on public.seller_profiles(user_id);
create index seller_profiles_status_idx on public.seller_profiles(status);

create trigger set_seller_profiles_updated_at
before update on public.seller_profiles
for each row execute function public.set_updated_at();

create table public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team_name text,
  email text not null,
  website text,
  expertise text not null,
  planned_agent_types text not null,
  offers_custom_services boolean not null default false,
  payout_preference text,
  notes text,
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seller_applications_status_idx on public.seller_applications(status);

create trigger set_seller_applications_updated_at
before update on public.seller_applications
for each row execute function public.set_updated_at();

create table public.marketplace_agents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_type text not null default 'platform'
    check (owner_type in ('platform', 'seller')),
  seller_id uuid references public.seller_profiles(id) on delete set null,
  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'in_review',
        'needs_changes',
        'approved',
        'rejected',
        'suspended'
      )
    ),
  is_featured boolean not null default false,
  is_verified boolean not null default false,
  category_id uuid not null references public.agent_categories(id) on delete restrict,
  tags text[] not null default '{}',
  pricing_type text not null default 'custom_quote'
    check (pricing_type in ('free', 'one_time', 'monthly', 'custom_quote')),
  price_usd numeric(12, 2),
  price_cny numeric(12, 2),
  delivery_type text not null
    check (
      delivery_type in (
        'prompt_template',
        'workflow_template',
        'hosted_agent',
        'website_chatbot',
        'custom_business_agent'
      )
    ),
  supported_languages text[] not null default array['en', 'zh'],
  demo_url text,
  demo_enabled boolean not null default false,
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  purchase_count integer not null default 0 check (purchase_count >= 0),
  install_count integer not null default 0 check (install_count >= 0),
  title_en text not null,
  title_zh text not null,
  short_description_en text not null,
  short_description_zh text not null,
  description_en text not null,
  description_zh text not null,
  features_en jsonb not null default '[]'::jsonb,
  features_zh jsonb not null default '[]'::jsonb,
  faq_en jsonb not null default '[]'::jsonb,
  faq_zh jsonb not null default '[]'::jsonb,
  setup_instructions_en text not null default '',
  setup_instructions_zh text not null default '',
  data_permissions_en text not null default '',
  data_permissions_zh text not null default '',
  version text not null default '1.0.0',
  changelog_en text,
  changelog_zh text,
  screenshots jsonb default '[]'::jsonb,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (supported_languages <@ array['en', 'zh'])
);

create index marketplace_agents_category_id_idx on public.marketplace_agents(category_id);
create index marketplace_agents_seller_id_idx on public.marketplace_agents(seller_id);
create index marketplace_agents_status_idx on public.marketplace_agents(status);
create index marketplace_agents_owner_type_idx on public.marketplace_agents(owner_type);
create index marketplace_agents_featured_idx on public.marketplace_agents(is_featured);

create trigger set_marketplace_agents_updated_at
before update on public.marketplace_agents
for each row execute function public.set_updated_at();

create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.marketplace_agents(id) on delete restrict,
  request_type text not null
    check (request_type in ('buy_agent', 'setup_service', 'custom_version')),
  name text not null,
  email text not null,
  company text,
  message text,
  budget_range text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'in_progress', 'closed', 'rejected')),
  amount_usd numeric(12, 2),
  amount_cny numeric(12, 2),
  currency text,
  platform_commission_rate numeric(5, 4),
  seller_revenue_rate numeric(5, 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchase_requests_agent_id_idx on public.purchase_requests(agent_id);
create index purchase_requests_status_idx on public.purchase_requests(status);

create trigger set_purchase_requests_updated_at
before update on public.purchase_requests
for each row execute function public.set_updated_at();

create table public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  company_name text not null,
  agent_goal text not null,
  existing_website text,
  has_documents boolean not null default false,
  required_integrations text,
  budget_range text,
  timeline text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  notes text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'quoted', 'in_progress', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index custom_requests_status_idx on public.custom_requests(status);
create index custom_requests_contact_email_idx on public.custom_requests(contact_email);

create trigger set_custom_requests_updated_at
before update on public.custom_requests
for each row execute function public.set_updated_at();

create table public.agent_reviews (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.marketplace_agents(id) on delete cascade,
  reviewer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index agent_reviews_agent_id_idx on public.agent_reviews(agent_id);
create index agent_reviews_status_idx on public.agent_reviews(status);

create table public.agent_review_notes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.marketplace_agents(id) on delete cascade,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  reviewer_name text,
  feedback text not null,
  status_at_review text
    check (
      status_at_review is null or status_at_review in (
        'draft',
        'submitted',
        'in_review',
        'needs_changes',
        'approved',
        'rejected',
        'suspended'
      )
    ),
  created_at timestamptz not null default now()
);

create index agent_review_notes_agent_id_idx on public.agent_review_notes(agent_id);
