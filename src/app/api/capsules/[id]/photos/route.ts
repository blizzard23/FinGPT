import { randomUUID } from "crypto";
import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeQualityScore } from "@/lib/quality";
import { parseExif } from "@/lib/exif";
import { reverseGeocode } from "@/lib/geocode";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file
const THUMB_WIDTH = 800;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: capsuleId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  // Explicit membership check for a clean error (RLS would also block).
  const { data: membership } = await supabase
    .from("capsule_members")
    .select("user_id")
    .eq("capsule_id", capsuleId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "Keine Dateien." }, { status: 400 });
  }

  const created: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: zu groß (max. 25 MB)`);
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const photoId = randomUUID();

      const pipeline = sharp(buffer, { failOn: "none" }).rotate();
      const meta = await pipeline.metadata();

      const thumb = await sharp(buffer, { failOn: "none" })
        .rotate()
        .resize(THUMB_WIDTH, THUMB_WIDTH, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const [quality, exif] = await Promise.all([
        computeQualityScore(buffer),
        parseExif(buffer),
      ]);

      const locationName =
        exif.lat != null && exif.lng != null
          ? await reverseGeocode(exif.lat, exif.lng)
          : null;

      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
      const originalPath = `${capsuleId}/${photoId}/original.${ext}`;
      const thumbPath = `${capsuleId}/${photoId}/thumb.jpg`;

      const up1 = await supabase.storage
        .from("photos")
        .upload(originalPath, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
      if (up1.error) throw new Error(up1.error.message);

      const up2 = await supabase.storage
        .from("photos")
        .upload(thumbPath, thumb, { contentType: "image/jpeg", upsert: false });
      if (up2.error) throw new Error(up2.error.message);

      const { error: insertError, data: inserted } = await supabase
        .from("photos")
        .insert({
          capsule_id: capsuleId,
          uploader_id: user.id,
          storage_path: originalPath,
          thumb_path: thumbPath,
          taken_at: exif.takenAt,
          width: meta.width ?? null,
          height: meta.height ?? null,
          quality_score: quality,
          status: "pending",
          location_name: locationName,
          lat: exif.lat,
          lng: exif.lng,
        })
        .select("id")
        .single();

      if (insertError || !inserted) throw new Error(insertError?.message ?? "DB");
      created.push(inserted.id);
    } catch (err) {
      errors.push(`${file.name}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ created: created.length, errors });
}
