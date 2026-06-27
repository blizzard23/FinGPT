-- Invite preview + redemption RPCs, and the private photo storage bucket.

-- Preview an invite by token WITHOUT requiring membership (the token is the
-- secret). Returns just enough to render the emotional landing page.
create or replace function public.get_invite_preview(p_token text)
returns table (
  capsule_id uuid,
  capsule_name text,
  capsule_status text,
  inviter_name text,
  inviter_avatar text,
  member_count bigint,
  expired boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    c.name,
    c.status,
    p.display_name,
    p.avatar_url,
    (select count(*) from public.capsule_members m where m.capsule_id = c.id),
    (i.expires_at is not null and i.expires_at < now())
  from public.capsule_invites i
  join public.capsules c on c.id = i.capsule_id
  join public.profiles p on p.id = i.created_by
  where i.token = p_token;
$$;

grant execute on function public.get_invite_preview(text) to anon, authenticated;

-- Redeem an invite for the current user. Idempotent: re-redeeming is a no-op.
-- Returns the capsule id so the caller can route into it.
create or replace function public.redeem_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capsule_id uuid;
  v_expires timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select i.capsule_id, i.expires_at into v_capsule_id, v_expires
  from public.capsule_invites i
  where i.token = p_token;

  if v_capsule_id is null then
    raise exception 'invite not found';
  end if;

  if v_expires is not null and v_expires < now() then
    raise exception 'invite expired';
  end if;

  insert into public.capsule_members (capsule_id, user_id, role)
  values (v_capsule_id, auth.uid(), 'member')
  on conflict (capsule_id, user_id) do nothing;

  return v_capsule_id;
end;
$$;

grant execute on function public.redeem_invite(text) to authenticated;

-- Private bucket for original photos and thumbnails.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Storage path convention: {capsule_id}/{photo_id}[_thumb].{ext}
-- Members of the capsule may read; uploaders may write into their capsules.
create policy "storage photos member read" on storage.objects
  for select using (
    bucket_id = 'photos'
    and public.is_capsule_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

create policy "storage photos member insert" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and public.is_capsule_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

create policy "storage photos member delete" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and public.is_capsule_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
