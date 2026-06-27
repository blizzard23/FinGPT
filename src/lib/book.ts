import { createClient } from "@/lib/supabase/server";
import { signPhotoPaths } from "@/lib/photos";
import { selectHighlights } from "@/lib/highlights";
import { weaveMemory } from "@/lib/weave";
import { REACTIONS } from "@/lib/reactions";
import { formatEuro } from "@/lib/book-format";
import type { Capsule, ReactionType } from "@/lib/supabase/types";

export { formatEuro };

export const DEFAULT_BOOK_TOTAL_CENTS = 2900; // 29,00 €
const MAX_HIGHLIGHTS = 10;

const EMOJI_BY_TYPE: Record<ReactionType, string> = Object.fromEntries(
  REACTIONS.map((r) => [r.type, r.emoji])
) as Record<ReactionType, string>;

export type BookPage = {
  photoId: string;
  imageUrl: string | null;
  thumbUrl: string | null;
  width: number | null;
  height: number | null;
  caption: string;
};

export type BookEconomics = {
  totalCents: number;
  memberCount: number;
  shareCents: number;
  unlockedCount: number;
  unlockedByMe: boolean;
};

export type BookData = {
  capsule: Capsule;
  dateRange: { start: string | null; end: string | null };
  pages: BookPage[];
  economics: BookEconomics;
};

export async function getBook(capsuleId: string): Promise<BookData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: capsule } = await supabase
    .from("capsules")
    .select("*")
    .eq("id", capsuleId)
    .single();
  if (!capsule) return null;

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("capsule_id", capsuleId)
    .eq("status", "released");

  const photoList = photos ?? [];
  const ids = photoList.map((p) => p.id);

  // Engagement signals for ranking + weaving.
  const [{ data: reactions }, { data: comments }, { data: notes }] = await Promise.all([
    ids.length
      ? supabase.from("reactions").select("photo_id, type").in("photo_id", ids)
      : Promise.resolve({ data: [] as { photo_id: string; type: ReactionType }[] }),
    ids.length
      ? supabase.from("comments").select("photo_id").in("photo_id", ids)
      : Promise.resolve({ data: [] as { photo_id: string }[] }),
    ids.length
      ? supabase.from("moment_notes").select("photo_id, body").in("photo_id", ids)
      : Promise.resolve({ data: [] as { photo_id: string; body: string }[] }),
  ]);

  const reactionsByPhoto = new Map<string, ReactionType[]>();
  for (const r of reactions ?? []) {
    const arr = reactionsByPhoto.get(r.photo_id) ?? [];
    arr.push(r.type);
    reactionsByPhoto.set(r.photo_id, arr);
  }
  const commentCountByPhoto = new Map<string, number>();
  for (const c of comments ?? []) {
    commentCountByPhoto.set(c.photo_id, (commentCountByPhoto.get(c.photo_id) ?? 0) + 1);
  }
  const notesByPhoto = new Map<string, string[]>();
  for (const n of notes ?? []) {
    const arr = notesByPhoto.get(n.photo_id) ?? [];
    arr.push(n.body);
    notesByPhoto.set(n.photo_id, arr);
  }

  const highlightIds = selectHighlights(
    photoList.map((p) => ({
      id: p.id,
      quality_score: p.quality_score,
      reactionCount: reactionsByPhoto.get(p.id)?.length ?? 0,
      commentCount: commentCountByPhoto.get(p.id) ?? 0,
    })),
    MAX_HIGHLIGHTS
  );

  const byId = new Map(photoList.map((p) => [p.id, p]));
  const orderedHighlights = highlightIds.map((id) => byId.get(id)!).filter(Boolean);

  const urls = await signPhotoPaths(
    orderedHighlights.flatMap((p) =>
      [p.storage_path, p.thumb_path].filter((s): s is string => Boolean(s))
    )
  );

  const pages: BookPage[] = orderedHighlights.map((photo) => {
    const types = reactionsByPhoto.get(photo.id) ?? [];
    const topType = mostFrequent(types);
    const caption = weaveMemory({
      locationName: photo.location_visible ? photo.location_name : null,
      date: photo.taken_at ?? photo.released_at,
      topReactionEmoji: topType ? EMOJI_BY_TYPE[topType] : null,
      notes: notesByPhoto.get(photo.id) ?? [],
    });
    return {
      photoId: photo.id,
      imageUrl: urls.get(photo.storage_path) ?? null,
      thumbUrl: photo.thumb_path ? (urls.get(photo.thumb_path) ?? null) : null,
      width: photo.width,
      height: photo.height,
      caption,
    };
  });

  // Economics for the shared unlock.
  const { count: memberCount } = await supabase
    .from("capsule_members")
    .select("*", { count: "exact", head: true })
    .eq("capsule_id", capsuleId);

  const { data: intents } = await supabase
    .from("book_intents")
    .select("user_id")
    .eq("capsule_id", capsuleId);

  const totalCents = capsule.book_total_cents ?? DEFAULT_BOOK_TOTAL_CENTS;
  const members = memberCount ?? 1;
  const shareCents = Math.ceil(totalCents / Math.max(1, members));

  return {
    capsule,
    dateRange: { start: capsule.drip_start_at, end: capsule.drip_end_at },
    pages,
    economics: {
      totalCents,
      memberCount: members,
      shareCents,
      unlockedCount: (intents ?? []).length,
      unlockedByMe: (intents ?? []).some((i) => i.user_id === user?.id),
    },
  };
}

function mostFrequent(types: ReactionType[]): ReactionType | null {
  if (types.length === 0) return null;
  const counts = new Map<ReactionType, number>();
  for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
  let best: ReactionType | null = null;
  let bestCount = -1;
  for (const [type, count] of counts) {
    if (count > bestCount) {
      best = type;
      bestCount = count;
    }
  }
  return best;
}
