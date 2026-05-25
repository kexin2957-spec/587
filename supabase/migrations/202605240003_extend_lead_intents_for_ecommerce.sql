alter table public.leads
drop constraint if exists leads_intent_check;

alter table public.leads
add constraint leads_intent_check
check (
  intent in (
    'service_inquiry',
    'pricing_inquiry',
    'booking_request',
    'support_question',
    'sales_lead',
    'custom_project_request',
    'product_question',
    'product_recommendation',
    'shipping_question',
    'return_refund_question',
    'order_tracking_request',
    'purchase_intent',
    'human_handoff',
    'unknown'
  )
);
