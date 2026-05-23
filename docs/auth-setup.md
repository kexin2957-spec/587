# Auth and Role Setup

Phase 10 uses Supabase Auth and a `public.profiles` table with three roles:

- `buyer`
- `seller`
- `admin`

## Environment

Set these values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALLOW_MOCK_ADMIN=false
```

`SUPABASE_SERVICE_ROLE_KEY` is used only by server routes that already perform admin-style database operations. Never expose it to the browser.

`ALLOW_MOCK_ADMIN=true` enables the protected admin pages without Supabase only for local demo validation. Keep it unset or `false` in production.

## Create the First Admin

1. Apply migrations in Supabase.
2. Create a user from `/sign-up` or the Supabase Auth dashboard.
3. Promote that user in SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

If the profile was not created automatically, create it from the Auth user:

```sql
insert into public.profiles (user_id, email, display_name, role)
select id, email, coalesce(raw_user_meta_data ->> 'display_name', email), 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update
set role = 'admin';
```

Do not hardcode an admin email in application code. Admin access is granted by the `profiles.role` value.

## Seller Role

Unauthenticated seller uploads remain supported as seller upload requests for the MVP. Later, approved seller accounts can be connected by setting:

```sql
update public.profiles
set role = 'seller'
where email = 'seller@example.com';
```

Seller-owned agent management is prepared in RLS, but public listing still requires admin approval.
