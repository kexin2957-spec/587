alter table public.marketplace_agents
  add column if not exists review_reason_code text;

alter table public.marketplace_agents
  drop constraint if exists marketplace_agents_review_reason_code_check;

alter table public.marketplace_agents
  add constraint marketplace_agents_review_reason_code_check
  check (
    review_reason_code is null or
    review_reason_code in (
      'missing_content',
      'demo_not_working',
      'exaggerated_claims',
      'copyright_risk',
      'unsafe_content',
      'unclear_delivery',
      'pricing_issue',
      'poor_cover',
      'other'
    )
  );
