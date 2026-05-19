-- ============================================================
-- ImmoMatch - Schema SQL initial
-- À coller dans Supabase SQL Editor (https://supabase.com/dashboard
-- → ton projet → SQL Editor → New query → coller → Run)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table profiles (extension de auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profils visibles publiquement (nom + tel pour contact)"
  on public.profiles for select
  using (true);

create policy "Update de son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger : auto-créer une ligne profiles quand un user s'inscrit
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Table listings (annonces)
-- ------------------------------------------------------------
create type listing_type as enum ('maison', 'appartement');
create type listing_status as enum ('active', 'archived');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  type listing_type not null,
  city text not null,
  surface integer not null check (surface > 0),
  rooms integer not null check (rooms > 0),
  price integer not null check (price > 0),
  description text,
  photos jsonb not null default '[]'::jsonb,
  status listing_status not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.listings enable row level security;

create policy "Annonces actives visibles publiquement"
  on public.listings for select
  using (status = 'active' or auth.uid() = owner_id);

create policy "Insertion par le owner"
  on public.listings for insert
  with check (auth.uid() = owner_id);

create policy "Update par le owner"
  on public.listings for update
  using (auth.uid() = owner_id);

create policy "Delete par le owner"
  on public.listings for delete
  using (auth.uid() = owner_id);

-- Index pour les filtres de recherche (US-08)
create index listings_city_idx on public.listings (city);
create index listings_type_idx on public.listings (type);
create index listings_price_idx on public.listings (price);
create index listings_surface_idx on public.listings (surface);

-- Trigger : auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_touch_updated_at
  before update on public.listings
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 3. Table favorites (US-10)
-- ------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Gestion de ses propres favoris"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. Table messages (US-13, US-14)
-- ------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete set null,
  buyer_name text not null,
  buyer_email text not null,
  content text not null,
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Insertion par tout utilisateur (acheteur peut être anonyme)"
  on public.messages for insert
  with check (true);

create policy "Lecture par le owner de l'annonce"
  on public.messages for select
  using (auth.uid() = (select owner_id from public.listings where id = listing_id));

create policy "Mark as read par le owner de l'annonce"
  on public.messages for update
  using (auth.uid() = (select owner_id from public.listings where id = listing_id));

create index messages_listing_idx on public.messages (listing_id);

-- ============================================================
-- 5. Storage : policies pour le bucket "listings"
--    (créer le bucket AVANT de lancer ces policies, via UI :
--     Storage → New bucket → name="listings" → Public bucket coché)
-- ============================================================

create policy "Photos d'annonce visibles publiquement"
  on storage.objects for select
  using (bucket_id = 'listings');

create policy "Upload de photos dans son dossier (uid)"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Update de ses propres photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Delete de ses propres photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
