# Pizzapolis v2

SPA built with React + Vite, deployed on Vercel, with auth started in Supabase.

## Current product shape

- Public map and discovery
- Auth required for creating plans, joining plans, adding spots, groups, profile and admin
- Admin access controlled by `profiles.role = 'admin'`
- Legacy demo seeding removed
- Local browser storage remains only as a temporary empty fallback until the real Supabase migration is finished

## Auth confirmation requirements

Supabase settings expected:

- Site URL: `https://pizzapolisv2.vercel.app`
- Redirect URLs:
  - `https://pizzapolisv2.vercel.app/**`
  - `http://localhost:5173/**`

Vercel SPA rewrite required:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The client route that must exist is:

- `/auth/confirm`

## Environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- optional: `VITE_APP_URL=https://pizzapolisv2.vercel.app`

## Run

```powershell
Set-Location "C:\Users\Jose\Desktop\pizzapolisv2"
npm install
npm run dev
```

## Reset temporary local fallback

```js
localStorage.removeItem('pizzapolis_local_db');
location.reload();
```
