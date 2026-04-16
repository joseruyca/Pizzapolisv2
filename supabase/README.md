# Supabase setup for Pizzapolis

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill `VITE_SUPABASE_URL` and either `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`.
4. In Supabase SQL editor, run `supabase/schema.sql`.
5. In the `profiles` table, set your own user `role` to `admin`.
6. Restart `npm run dev`.

## What this pass includes
- Real auth with email/password
- Public map/discover access
- Protected actions and private routes
- Admin-only `/Admin` route
- Temporary local data bridge until the full data migration to Supabase
