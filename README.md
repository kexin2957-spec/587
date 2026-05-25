# AI Agent Marketplace

A bilingual AI Agent Marketplace for businesses. Buyers can browse launch-ready AI agents, view product detail pages, try demos, place manual orders, and access delivery documentation. Admins can review marketplace activity, orders, leads, seller applications, custom requests, and delivery packages.

The current launch focuses on two sellable agents:

- Website Sales & Lead Capture Agent
- E-commerce Product Support Agent

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth and database
- English and Chinese language switching
- Mock in-memory mode for local demo when Supabase is not configured

## Run Locally

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Open the local URL printed by Next.js.

For local admin demo mode without Supabase:

```powershell
$env:ALLOW_MOCK_ADMIN="true"
npm run dev
```

`ALLOW_MOCK_ADMIN=true` is only for local validation. Do not enable it in production.

## Scripts

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

Vercel should use:

- Install command: `npm install`
- Build command: `npm run build`
- Framework preset: Next.js

## Environment Variables

Create `.env.local` for local development and add the same production values in Vercel project settings.

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALLOW_MOCK_ADMIN=false
ALLOW_MOCK_SELLER=false

OPENAI_API_KEY=
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
WIDGET_SIGNING_SECRET=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=
PAYPAL_CLIENT_SECRET=

RESEND_API_KEY=
SENDGRID_API_KEY=
POSTMARK_SERVER_TOKEN=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
```

- `NEXT_PUBLIC_SITE_URL`: production site URL used when generating order, delivery, dashboard, docs, and embed links.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon key for browser auth and approved-agent reads.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key for admin APIs, orders, delivery packages, leads, customer configs, and marketplace records.
- `ALLOW_MOCK_ADMIN`: optional local-only switch for admin demo mode when Supabase is not configured.
- `ALLOW_MOCK_SELLER`: optional local-only switch for seller demo mode when Supabase is not configured.
- `OPENAI_API_KEY`: optional. When omitted, the agent runtime uses deterministic fallback behavior so demo and build still work.
- `AI_PROVIDER` / `AI_MODEL`: optional AI runtime controls.
- `WIDGET_SIGNING_SECRET`: recommended production secret for signed widget domain validation.
- Stripe and PayPal variables are optional payment-readiness variables. They are not required for the current manual-order launch build.
- Email provider variables are optional notification-readiness variables. They are not required for the current launch build.

Do not commit real `.env`, `.env.local`, service role keys, payment secrets, SMTP passwords, or provider tokens.

## Supabase Setup

Apply migrations in order:

```text
supabase/migrations/202605230001_create_marketplace_schema.sql
supabase/migrations/202605230002_add_lead_management_fields.sql
supabase/migrations/202605230003_add_auth_profiles_and_rls.sql
supabase/migrations/202605230004_add_admin_notes_for_launch_readiness.sql
supabase/migrations/202605240001_add_launch_orders.sql
supabase/migrations/202605240002_add_widget_configs_and_leads.sql
supabase/migrations/202605240003_extend_lead_intents_for_ecommerce.sql
supabase/migrations/202605240004_add_delivery_license_domains.sql
supabase/migrations/202605240005_add_agent_licenses_usage_logs.sql
supabase/migrations/202605240006_add_agent_runtime_sessions.sql
supabase/migrations/202605240007_add_customer_knowledge_configuration.sql
supabase/migrations/202605240008_add_customer_dashboard_access_token.sql
supabase/migrations/202605240009_add_payments_and_billing_readiness.sql
supabase/migrations/202605240010_add_seller_marketplace_system.sql
supabase/migrations/202605240011_add_audit_logs_security_readiness.sql
supabase/migrations/202605240012_add_sales_leads.sql
```

Then seed demo categories and platform-owned approved agents:

```text
supabase/seed.sql
```

You can run the SQL in the Supabase SQL editor or use the Supabase CLI:

```bash
supabase db push
supabase db reset
```

Use `supabase db reset` only for disposable local databases because it clears existing data.

## Admin Setup

1. Apply migrations and seed data.
2. Create a user through `/sign-up` or the Supabase Auth dashboard.
3. Promote the user to admin:

```sql
update public.profiles
set role = 'admin'
where email = 'owner@company-domain.com';
```

If the profile row does not exist yet:

```sql
insert into public.profiles (user_id, email, display_name, role)
select id, email, coalesce(raw_user_meta_data ->> 'display_name', email), 'admin'
from auth.users
where email = 'owner@company-domain.com'
on conflict (user_id) do update
set role = 'admin';
```

Admin routes require `profiles.role = 'admin'` when Supabase is configured.

## Main URLs

- `/`
- `/marketplace`
- `/agents/website-customer-support-agent`
- `/agents/ecommerce-product-support-agent`
- `/demo/website-customer-support-agent`
- `/demo/ecommerce-product-support-agent`
- `/about`
- `/case-studies`
- `/sales-kit`
- `/embed/agents/ecommerce-product-support-agent`
- `/docs/install-website-agent`
- `/docs/install-ecommerce-agent`
- `/orders/[orderNumber]/success`
- `/customer/orders/[orderNumber]`
- `/delivery/[orderNumber]`
- `/embed/agents/[agentId]`
- `/widget.js`
- `/custom-service`
- `/become-a-seller`
- `/api/sales-leads`
- `/admin`
- `/admin/orders`
- `/admin/leads`
- `/admin/agents`
- `/admin/custom-requests`
- `/admin/purchase-requests`
- `/admin/seller-applications`
- `/policies/refund-policy`
- `/policies/privacy-policy`
- `/policies/terms`
- `/policies/license`
- `/policies/seller-guidelines`
- `/policies/review-policy`

## Demo Video Readiness

Ready demo path:

1. Open the home page and show the launch-ready marketplace positioning.
2. Browse `/marketplace` and show both launch agents.
3. Open the Website Sales Agent detail page, try the demo, and place a manual order.
4. Open the order confirmation page and show order number, selected plan, next steps, and docs.
5. Open the customer delivery page and show status, embed code, configuration summary, leads, documentation link, and support CTA.
6. Open `/docs/install-website-agent` and `/docs/install-ecommerce-agent`.
7. Open the E-commerce Agent detail/embed demo.
8. Switch English/Chinese and show public content changes.
9. Use mobile viewport to show responsive home, marketplace, and detail pages.

## Launch Checklist

- [ ] Home page works.
- [ ] Marketplace works.
- [ ] About / Why Us page works.
- [ ] Demo Cases page works.
- [ ] Sales Kit page and sales qualification form work.
- [ ] Website Agent detail page works.
- [ ] E-commerce Agent detail page works.
- [ ] Order flow works.
- [ ] Admin orders works after Supabase admin user is configured.
- [ ] Leads dashboard works.
- [ ] Embed widget works.
- [ ] Customer delivery page works.
- [ ] English/Chinese switch works.
- [ ] Mobile layout works.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Production `NEXT_PUBLIC_SITE_URL` is set.
- [ ] Supabase URL, anon key, and service role key are set in Vercel.
- [ ] No real secret keys are committed.
- [ ] `ALLOW_MOCK_ADMIN` is not enabled in production.
- [ ] `ALLOW_MOCK_SELLER` is not enabled in production.
- [ ] `WIDGET_SIGNING_SECRET` is set in production.

## Vercel Deployment

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Create a new Vercel project from the repository.
3. Confirm Vercel uses the Next.js framework preset.
4. Set the build command to `npm run build`.
5. Add environment variables from `.env.example`.
6. Set `NEXT_PUBLIC_SITE_URL` to the final production URL.
7. Apply Supabase migrations.
8. Run `supabase/seed.sql`.
9. Create and promote the first admin user.
10. Deploy.
11. After deploy, submit one test order and confirm the order confirmation, customer dashboard, admin order detail, docs links, and embed widget render correctly.

## Known Limitations

- Payment automation is not implemented. Orders use manual contact/payment confirmation.
- Stripe and PayPal keys are optional and are not required to build.
- Email provider keys are optional. Provider-backed transactional email is not active yet.
- Agent runtime uses OpenAI when `OPENAI_API_KEY` is configured and deterministic fallback behavior when it is not.
- Customer dashboard and delivery documentation are present. Advanced custom workflows still require Custom Version scope.
- Admin routes require Supabase Auth and an admin profile in production.
- Real-time CRM, Shopify, order, inventory, calendar, payment, and private API integrations require Custom Version work.
- License/domain protection requires generated licenses, allowed domains, and production `WIDGET_SIGNING_SECRET`.
- In-memory rate limiting is suitable for local validation; use a shared store such as Upstash Redis for multi-region production hardening.
- Mock mode stores data in memory and resets when the server restarts.
