-- Local development seed. Runs after migrations on `supabase db reset`.
-- Creates two users, one capsule, membership, and a handful of photos so the
-- drip/feed can be exercised without real uploads.
--
-- Demo login (local only): lina@example.com / tom@example.com, password "password".

-- Two auth users. The profiles trigger fills public.profiles automatically.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'lina@example.com', crypt('password', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}',
   '{"display_name":"Lina"}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'tom@example.com', crypt('password', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}',
   '{"display_name":"Tom"}')
on conflict (id) do nothing;

-- A capsule owned by Lina. The capsule trigger adds her as owner-member.
insert into public.capsules (
  id, name, owner_id, status, drip_start_at, drip_end_at, drip_interval, photos_per_release
)
values (
  '33333333-3333-3333-3333-333333333333', 'Toskana, September',
  '11111111-1111-1111-1111-111111111111', 'draft',
  now(), now() + interval '14 days', 'daily', 1
)
on conflict (id) do nothing;

-- Tom joins.
insert into public.capsule_members (capsule_id, user_id, role)
values ('33333333-3333-3333-3333-333333333333',
        '22222222-2222-2222-2222-222222222222', 'member')
on conflict do nothing;

-- Seed photos with varied quality so the drip has something to order.
insert into public.photos (capsule_id, uploader_id, storage_path, quality_score, status, taken_at)
select
  '33333333-3333-3333-3333-333333333333',
  case when g % 2 = 0 then '11111111-1111-1111-1111-111111111111'
       else '22222222-2222-2222-2222-222222222222' end,
  'seed/placeholder-' || g || '.jpg',
  (g * 7 % 100) / 100.0,
  'pending',
  now() - (g || ' hours')::interval
from generate_series(1, 12) as g
on conflict do nothing;

-- An invite token for testing the onboarding flow: /join/seed-invite-token
insert into public.capsule_invites (capsule_id, token, created_by)
values ('33333333-3333-3333-3333-333333333333', 'seed-invite-token',
        '11111111-1111-1111-1111-111111111111')
on conflict (token) do nothing;
