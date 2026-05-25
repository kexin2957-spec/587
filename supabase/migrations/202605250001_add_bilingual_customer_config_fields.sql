alter table public.customer_agent_configs
  add column if not exists business_description_en text,
  add column if not exists business_description_zh text,
  add column if not exists services_or_products_en text,
  add column if not exists services_or_products_zh text,
  add column if not exists pricing_ranges_en text,
  add column if not exists pricing_ranges_zh text,
  add column if not exists welcome_message_en text,
  add column if not exists welcome_message_zh text;

update public.customer_agent_configs
set
  business_description_en = coalesce(business_description_en, business_description, company_introduction, ''),
  services_or_products_en = coalesce(services_or_products_en, services_or_products, services_products, ''),
  pricing_ranges_en = coalesce(pricing_ranges_en, pricing_ranges, ''),
  welcome_message_en = coalesce(welcome_message_en, welcome_message, '')
where
  business_description_en is null
  or services_or_products_en is null
  or pricing_ranges_en is null
  or welcome_message_en is null;
