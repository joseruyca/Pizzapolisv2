alter table public.profiles
  add column if not exists bio text,
  add column if not exists city text,
  add column if not exists favorite_slice text,
  add column if not exists favorite_spot_id uuid references public.spots(id) on delete set null,
  add column if not exists instagram_url text,
  add column if not exists website_url text,
  add column if not exists updated_at timestamptz default now();

create index if not exists profiles_favorite_spot_id_idx on public.profiles(favorite_spot_id);
