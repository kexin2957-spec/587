alter table public.marketplace_agents
  add column if not exists cover_image_url text,
  add column if not exists who_it_is_for_en text not null default '',
  add column if not exists who_it_is_for_zh text not null default '',
  add column if not exists use_cases_en jsonb not null default '[]'::jsonb,
  add column if not exists use_cases_zh jsonb not null default '[]'::jsonb,
  add column if not exists what_customer_receives_en text not null default '',
  add column if not exists what_customer_receives_zh text not null default '',
  add column if not exists limitations_en text not null default '',
  add column if not exists limitations_zh text not null default '',
  add column if not exists custom_upgrade_options_en text not null default '',
  add column if not exists custom_upgrade_options_zh text not null default '',
  add column if not exists demo_questions jsonb not null default '[]'::jsonb,
  add column if not exists demo_answers jsonb not null default '[]'::jsonb,
  add column if not exists sample_conversation text not null default '',
  add column if not exists pricing_plans jsonb not null default '[]'::jsonb,
  add column if not exists delivery_settings jsonb not null default '{}'::jsonb,
  add column if not exists agent_rights_confirmed boolean not null default false,
  add column if not exists content_safety_confirmed boolean not null default false,
  add column if not exists review_policy_confirmed boolean not null default false,
  add column if not exists suspension_policy_confirmed boolean not null default false,
  add column if not exists sensitive_disclaimer_confirmed boolean not null default false;

alter table public.marketplace_agents
  drop constraint if exists marketplace_agents_status_check;

alter table public.marketplace_agents
  add constraint marketplace_agents_status_check
  check (
    status in (
      'draft',
      'submitted',
      'in_review',
      'needs_changes',
      'approved',
      'published',
      'rejected',
      'suspended',
      'archived'
    )
  );

drop policy if exists "Public read approved agents" on public.marketplace_agents;
create policy "Public read approved agents"
on public.marketplace_agents for select
to anon, authenticated
using (status in ('approved', 'published'));
