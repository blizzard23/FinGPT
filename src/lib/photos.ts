import { createClient } from "@/lib/supabase/server";
import type { Photo } from "@/lib/supabase/types";

export type PhotoWithUrls = Photo & {
  thumbUrl: string | null;
  fullUrl: string | null;
};

const SIGNED_TTL = 60 * 60; // 1 hour

// Create signed URLs for private storage paths in a single round-trip.
export async function signPhotoPaths(
  paths: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("photos")
    .createSignedUrls(unique, SIGNED_TTL);

  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}

export async function withSignedUrls(photos: Photo[]): Promise<PhotoWithUrls[]> {
  const paths = photos.flatMap((p) =>
    [p.thumb_path, p.storage_path].filter(Boolean as unknown as (s: string | null) => s is string)
  );
  const urls = await signPhotoPaths(paths);

  return photos.map((photo) => ({
    ...photo,
    thumbUrl: photo.thumb_path ? (urls.get(photo.thumb_path) ?? null) : null,
    fullUrl: urls.get(photo.storage_path) ?? null,
  }));
}

// The current user's own photos in a capsule (pending + released). RLS lets a
// user always see their own uploads, even before release.
export async function getMyPhotos(capsuleId: string): Promise<Photo[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("capsule_id", capsuleId)
    .eq("uploader_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
