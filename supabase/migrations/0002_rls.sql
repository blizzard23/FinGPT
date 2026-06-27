-- Row Level Security for Nachklang.
-- Principle: a user only sees data from capsules they are a member of.
-- Membership checks go through SECURITY DEFINER helpers to avoid the classic
-- "policy on capsule_members references capsule_members" infinite recursion.

create or replace function public.is_capsule_member(p_capsule_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.capsule_members
    where capsule_id = p_capsule_id and user_id = p_user_id
  );
$$;

create or replace function public.is_capsule_owner(p_capsule_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.capsules
    where id = p_capsule_id and owner_id = p_user_id
  );
$$;

-- Resolve the capsule a photo belongs to without tripping photo RLS.
create or replace function public.photo_capsule_id(p_photo_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select capsule_id from public.photos where id = p_photo_id;
$$;

-- Enable RLS everywhere.
alter table public.profiles enable row level security;
alter table public.capsules enable row level security;
alter table public.capsule_members enable row level security;
alter table public.capsule_invites enable row level security;
alter table public.photos enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.photo_moods enable row level security;
alter table public.moment_notes enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.book_intents enable row level security;

-- PROFILES: a user sees their own profile and profiles of co-members.
create policy "profiles self read" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.capsule_members mine
      join public.capsule_members theirs on mine.capsule_id = theirs.capsule_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- CAPSULES: members read; any authenticated user may create (as owner);
-- only the owner may update/delete.
create policy "capsules member read" on public.capsules
  for select using (public.is_capsule_member(id, auth.uid()));
create policy "capsules owner insert" on public.capsules
  for insert with check (owner_id = auth.uid());
create policy "capsules owner update" on public.capsules
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "capsules owner delete" on public.capsules
  for delete using (owner_id = auth.uid());

-- CAPSULE_MEMBERS: members of a capsule see its membership.
-- Inserts/deletes happen through SECURITY DEFINER RPCs, so policies stay tight.
create policy "members read" on public.capsule_members
  for select using (public.is_capsule_member(capsule_id, auth.uid()));
create policy "members self leave" on public.capsule_members
  for delete using (user_id = auth.uid());

-- CAPSULE_INVITES: members see invites of their capsules; owners create them.
-- Anonymous preview/redeem of an invite goes through RPCs (see 0003).
create policy "invites member read" on public.capsule_invites
  for select using (public.is_capsule_member(capsule_id, auth.uid()));
create policy "invites owner insert" on public.capsule_invites
  for insert with check (
    created_by = auth.uid() and public.is_capsule_owner(capsule_id, auth.uid())
  );
create policy "invites owner delete" on public.capsule_invites
  for delete using (public.is_capsule_owner(capsule_id, auth.uid()));

-- PHOTOS: members read released photos; uploaders also see their own pending.
create policy "photos member read" on public.photos
  for select using (
    public.is_capsule_member(capsule_id, auth.uid())
    and (status = 'released' or uploader_id = auth.uid())
  );
create policy "photos member insert" on public.photos
  for insert with check (
    uploader_id = auth.uid() and public.is_capsule_member(capsule_id, auth.uid())
  );
-- Uploader may edit their own photo (e.g. toggle location_visible).
create policy "photos uploader update" on public.photos
  for update using (uploader_id = auth.uid()) with check (uploader_id = auth.uid());
create policy "photos uploader delete" on public.photos
  for delete using (uploader_id = auth.uid());

-- REACTIONS: visible to members of the photo's capsule; users manage their own.
create policy "reactions member read" on public.reactions
  for select using (public.is_capsule_member(public.photo_capsule_id(photo_id), auth.uid()));
create policy "reactions self insert" on public.reactions
  for insert with check (
    user_id = auth.uid()
    and public.is_capsule_member(public.photo_capsule_id(photo_id), auth.uid())
  );
create policy "reactions self delete" on public.reactions
  for delete using (user_id = auth.uid());

-- COMMENTS
create policy "comments member read" on public.comments
  for select using (public.is_capsule_member(public.photo_capsule_id(photo_id), auth.uid()));
create policy "comments self insert" on public.comments
  for insert with check (
    user_id = auth.uid()
    and public.is_capsule_member(public.photo_capsule_id(photo_id), auth.uid())
  );
create policy "comments self delete" on public.comments
  for delete using (user_id = auth.uid());

-- PHOTO_MOODS (collective)
create policy "moods member read" on public.photo_moods
  for select using (public.is_capsule_member(public.photo_capsule_id(photo_id), auth.uid()));
create policy "moods self insert" on public.photo_moods
  for insert with check (
    user_id = auth.uid()
    and public.is_capsule_member(public.photo_capsule_id(photo_id), auth.uid())
  );
create policy "moods self delete" on public.photo_moods
  for delete using (user_id = auth.uid());

-- MOMENT_NOTES (collective)
create policy "notes member read" on public.moment_notes
  for select using (public.is_capsule_member(public.photo_capsule_id(photo_id), auth.uid()));
create policy "notes self insert" on public.moment_notes
  for insert with check (
    user_id = auth.uid()
    and public.is_capsule_member(public.photo_capsule_id(photo_id), auth.uid())
  );
create policy "notes self delete" on public.moment_notes
  for delete using (user_id = auth.uid());

-- PUSH_SUBSCRIPTIONS: strictly private to the owning user.
create policy "push self all" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- BOOK_INTENTS: members see capsule progress; users write only their own.
create policy "book intents member read" on public.book_intents
  for select using (public.is_capsule_member(capsule_id, auth.uid()));
create policy "book intents self insert" on public.book_intents
  for insert with check (
    user_id = auth.uid() and public.is_capsule_member(capsule_id, auth.uid())
  );
create policy "book intents self delete" on public.book_intents
  for delete using (user_id = auth.uid());
