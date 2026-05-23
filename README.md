# AI Agent Marketplace

A bilingual AI Agent Marketplace for businesses. Buyers can browse ready-made AI agents, view product-style detail pages, try demo placeholders, submit purchase/setup/custom-version leads, and request custom AI agent development. Sellers can apply and submit agents for review. Admins can review agents, seller applications, custom service requests, and buyer purchase requests.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, database, and future storage
- English and Chinese i18n foundation
- Mock in-memory mode for local demo when Supabase is not configured

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For local admin demo mode without Supabase:

```bash
$env:ALLOW_MOCK_ADMIN="true"
npm run dev
```

`ALLOW_MOCK_ADMIN=true` is only for local/demo validation. Do not enable it in production.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALLOW_MOCK_ADMIN=false
```

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon key for auth and public approved-agent reads.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key for admin reads/writes and lead insertion helpers.
- `ALLOW_MOCK_ADMIN`: set to `true` only for local mock admin validation when Supabase is not configured.

## Supabase Setup

Apply migrations in order:

```text
supabase/migrations/202605230001_create_marketplace_schema.sql
supabase/migrations/202605230002_add_lead_management_fields.sql
supabase/migrations/202605230003_add_auth_profiles_and_rls.sql
supabase/migrations/202605230004_add_admin_notes_for_launch_readiness.sql
```

Then seed demo categories and 12 platform-owned approved agents:

```text
supabase/seed.sql
```

You can run the SQL in the Supabase SQL editor or use the Supabase CLI:

```bash
supabase db push
supabase db reset
```

Use the reset command only for disposable local Supabase databases because it clears data.

## Admin Setup

1. Apply migrations.
2. Create a user through `/sign-up` or the Supabase Auth dashboard.
3. Promote the user:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

If the profile does not exist:

```sql
insert into public.profiles (user_id, email, display_name, role)
select id, email, coalesce(raw_user_meta_data ->> 'display_name', email), 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update
set role = 'admin';
```

Admin routes require `profiles.role = 'admin'` when Supabase is configured.

## Main Routes

- `/`
- `/marketplace`
- `/agents/[slug]`
- `/custom-service`
- `/become-a-seller`
- `/seller/upload`
- `/admin`
- `/admin/agents`
- `/admin/seller-applications`
- `/admin/custom-requests`
- `/admin/purchase-requests`
- `/policies/refund-policy`
- `/policies/privacy-policy`
- `/policies/terms`
- `/policies/seller-guidelines`
- `/policies/review-policy`
- `/sign-in`
- `/sign-up`

## Validation Commands

```bash
npm run lint
npm run typecheck
npm run build
```

Recommended manual checks:

- Switch English/Chinese, refresh, and confirm language persistence.
- Browse marketplace, search, filter, sort, and verify empty state.
- Submit Buy Agent, Buy + Setup Service, Request Custom Version, and Custom Service forms.
- Submit seller application and seller upload.
- In local demo mode, approve/suspend a submitted agent and verify public visibility changes.
- Confirm mobile nav and mobile marketplace filters work.

## Deployment

Vercel is the simplest deployment target:

1. Push the project to a Git repository.
2. Create a Vercel project from the repository.
3. Add Supabase environment variables in Vercel project settings.
4. Apply Supabase migrations and seed data before public demo.
5. Create and promote the first admin user.
6. Deploy.

Do not set `ALLOW_MOCK_ADMIN=true` in production.

## Known Limitations

- Payment automation is not implemented yet.
- Seller payouts and revenue-share payout automation are not implemented yet.
- Email notifications are placeholder service functions unless Resend, SendGrid, or another provider is configured.
- Demo chat is a placeholder unless connected to an AI provider.
- Mock mode stores submitted leads and seller agents in memory, so data resets when the server restarts.
- Supabase Storage is prepared conceptually, but screenshot/video upload storage is still a placeholder.

## Next Steps

- Add real payment/checkout and invoice flow.
- Add seller dashboard for authenticated approved sellers.
- Connect demo chat to an AI provider and per-agent knowledge/workflow configuration.
- Add real email notifications for new leads and review decisions.
- Add Supabase Storage upload flow for screenshots and videos.
- Add automated end-to-end tests for buyer, seller, and admin flows.
