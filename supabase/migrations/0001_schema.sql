-- Nachklang core schema
-- All timestamps are timestamptz. UUID primary keys default to gen_random_uuid().

create extension if not exists pgcrypto;

-- Profiles mirror auth.users (1:1). Created automatically on signup (see trigger).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Freund:in',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Enums modelled as text + check constraints for simplicity / forward-compat.
create table if not exists public.capsules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_photo_id uuid,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  drip_start_at timestamptz,
  drip_end_at timestamptz,
  drip_interval text not null default 'daily' check (drip_interval in ('daily', 'weekly')),
  photos_per_release integer not null default 1 check (photos_per_release >= 1),
  book_total_cents integer,
  created_at timestamptz not null default now()
);

create table if not exists public.capsule_members (
  capsule_id uuid not null references public.capsules (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (capsule_id, user_id)
);

create table if not exists public.capsule_invites (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules (id) on delete cascade,
  token text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules (id) on delete cascade,
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  thumb_path text,
  taken_at timestamptz,
  width integer,
  height integer,
  quality_score double precision not null default 0,
  status text not null default 'pending' check (status in ('pending', 'released')),
  release_at timestamptz,
  released_at timestamptz,
  location_name text,
  lat double precision,
  lng double precision,
  location_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists photos_capsule_status_idx on public.photos (capsule_id, status);

-- cover_photo_id references photos once both tables exist.
alter table public.capsules
  drop constraint if exists capsules_cover_photo_id_fkey;
alter table public.capsules
  add constraint capsules_cover_photo_id_fkey
  foreign key (cover_photo_id) references public.photos (id) on delete set null;

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('like', 'fire', 'laugh', 'love')),
  created_at timestamptz not null default now(),
  unique (photo_id, user_id, type)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.photo_moods (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mood text not null,
  created_at timestamptz not null default now(),
  unique (photo_id, user_id, mood)
);

create table if not exists public.moment_notes (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  source text not null default 'text' check (source in ('text', 'voice')),
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.book_intents (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  share_cents integer not null check (share_cents >= 0),
  created_at timestamptz not null default now(),
  unique (capsule_id, user_id)
);

-- Auto-create a profile row whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- When a capsule is created, the owner automatically becomes a member.
create or replace function public.handle_new_capsule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.capsule_members (capsule_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_capsule_created on public.capsules;
create trigger on_capsule_created
  after insert on public.capsules
  for each row execute function public.handle_new_capsule();
