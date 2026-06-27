-- Enable Realtime for the collective, live-updating tables so the group can
-- relive a moment together (comments appearing as they're written, etc.).
do $$
begin
  begin
    alter publication supabase_realtime add table public.comments;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.reactions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.photo_moods;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.moment_notes;
  exception when duplicate_object then null;
  end;
end $$;
