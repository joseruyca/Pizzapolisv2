create extension if not exists pgcrypto;

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text unique,
  address text,
  borough text,
  neighborhood text,
  latitude numeric,
  longitude numeric,
  standard_slice_price numeric(6,2),
  value_score numeric(4,2),
  status text not null default 'active' check (status in ('active','hidden','archived','pending')),
  notes text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  vibe text,
  scheduled_for timestamptz not null,
  max_participants integer not null default 6,
  status text not null default 'active' check (status in ('draft','active','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_members (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  unique (plan_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.spots enable row level security;
alter table public.plans enable row level security;
alter table public.plan_members enable row level security;
alter table public.messages enable row level security;

create policy "spots are public readable"
  on public.spots for select
  using (true);

create policy "authenticated users can add spots"
  on public.spots for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "spot owners or admins can update spots"
  on public.spots for update
  to authenticated
  using (auth.uid() = created_by or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "plans are public readable"
  on public.plans for select
  using (true);

create policy "authenticated users can create plans"
  on public.plans for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "plan owners or admins can update plans"
  on public.plans for update
  to authenticated
  using (auth.uid() = created_by or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "members can read plan membership"
  on public.plan_members for select
  using (true);

create policy "authenticated users can join plans"
  on public.plan_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "members can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.plan_members pm
      where pm.plan_id = messages.plan_id and pm.user_id = auth.uid()
    )
  );

create policy "members can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id and exists (
      select 1 from public.plan_members pm
      where pm.plan_id = messages.plan_id and pm.user_id = auth.uid()
    )
  );
