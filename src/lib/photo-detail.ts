import { createClient } from "@/lib/supabase/server";
import { signPhotoPaths } from "@/lib/photos";
import type {
  Comment,
  MomentNote,
  Photo,
  Profile,
  ReactionType,
} from "@/lib/supabase/types";

export type ReactionSummary = { type: ReactionType; count: number; mine: boolean };
export type MoodSummary = { mood: string; count: number; mine: boolean };
export type AuthoredNote = MomentNote & { author: Profile | null };
export type AuthoredComment = Comment & { author: Profile | null };

export type PhotoDetail = {
  photo: Photo;
  uploader: Profile | null;
  fullUrl: string | null;
  reactions: ReactionSummary[];
  moods: MoodSummary[];
  notes: AuthoredNote[];
  comments: AuthoredComment[];
};

export async function getPhotoDetail(
  photoId: string
): Promise<PhotoDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const myId = user?.id ?? null;

  const { data: photo } = await supabase
    .from("photos")
    .select("*")
    .eq("id", photoId)
    .single();
  if (!photo) return null;

  const [{ data: reactions }, { data: moods }, { data: notes }, { data: comments }] =
    await Promise.all([
      supabase.from("reactions").select("type, user_id").eq("photo_id", photoId),
      supabase.from("photo_moods").select("mood, user_id").eq("photo_id", photoId),
      supabase
        .from("moment_notes")
        .select("*")
        .eq("photo_id", photoId)
        .order("created_at", { ascending: true }),
      supabase
        .from("comments")
        .select("*")
        .eq("photo_id", photoId)
        .order("created_at", { ascending: true }),
    ]);

  // Resolve all author profiles in one query.
  const authorIds = new Set<string>([photo.uploader_id]);
  (notes ?? []).forEach((n) => authorIds.add(n.user_id));
  (comments ?? []).forEach((c) => authorIds.add(c.user_id));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", [...authorIds]);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Aggregate reactions by type.
  const reactionSummary: ReactionSummary[] = (
    ["love", "fire", "laugh", "like"] as ReactionType[]
  ).map((type) => {
    const rows = (reactions ?? []).filter((r) => r.type === type);
    return {
      type,
      count: rows.length,
      mine: rows.some((r) => r.user_id === myId),
    };
  });

  // Aggregate moods by emoji.
  const moodMap = new Map<string, { count: number; mine: boolean }>();
  for (const m of moods ?? []) {
    const entry = moodMap.get(m.mood) ?? { count: 0, mine: false };
    entry.count += 1;
    if (m.user_id === myId) entry.mine = true;
    moodMap.set(m.mood, entry);
  }
  const moodSummary: MoodSummary[] = [...moodMap.entries()].map(
    ([mood, { count, mine }]) => ({ mood, count, mine })
  );

  const urls = await signPhotoPaths([photo.storage_path]);

  return {
    photo,
    uploader: byId.get(photo.uploader_id) ?? null,
    fullUrl: urls.get(photo.storage_path) ?? null,
    reactions: reactionSummary,
    moods: moodSummary,
    notes: (notes ?? []).map((n) => ({ ...n, author: byId.get(n.user_id) ?? null })),
    comments: (comments ?? []).map((c) => ({
      ...c,
      author: byId.get(c.user_id) ?? null,
    })),
  };
}
