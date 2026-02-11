# Supabase Migrations

Run these in order:

1. `001_init_schema.sql`
2. `002_rls_and_policies.sql`
3. `003_prod_hardening.sql`
4. `004_seed_admin_role.sql`

Before running `004_seed_admin_role.sql`, replace `your-admin-email@domain.com` with your real admin email.

Also set this in `.env.local`:

```env
ADMIN_EMAILS=your-admin-email@domain.com
```
