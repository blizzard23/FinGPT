"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ReactionType, NoteSource } from "@/lib/supabase/types";

type ActionResult = { error?: string };

function revalidate(capsuleId: string, photoId: string) {
  revalidatePath(`/app/c/${capsuleId}/p/${photoId}`);
}

// One reaction of a given type per user/photo — tapping again removes it.
export async function toggleReaction(
  photoId: string,
  capsuleId: string,
  type: ReactionType
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("photo_id", photoId)
    .eq("user_id", user.id)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase
      .from("reactions")
      .insert({ photo_id: photoId, user_id: user.id, type });
    if (error) return { error: error.message };
  }

  revalidate(capsuleId, photoId);
  return {};
}

// Collective mood tag — each member can add/remove their own.
export async function toggleMood(
  photoId: string,
  capsuleId: string,
  mood: string
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("photo_moods")
    .select("id")
    .eq("photo_id", photoId)
    .eq("user_id", user.id)
    .eq("mood", mood)
    .maybeSingle();

  if (existing) {
    await supabase.from("photo_moods").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase
      .from("photo_moods")
      .insert({ photo_id: photoId, user_id: user.id, mood });
    if (error) return { error: error.message };
  }

  revalidate(capsuleId, photoId);
  return {};
}

// Uploader-only (RLS-enforced): hide or show the auto-detected location.
export async function setPhotoLocationVisible(
  photoId: string,
  capsuleId: string,
  visible: boolean
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("photos")
    .update({ location_visible: visible })
    .eq("id", photoId);
  if (error) return { error: error.message };

  revalidate(capsuleId, photoId);
  return {};
}

const noteSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  source: z.enum(["text", "voice"]),
});

export async function addNote(
  photoId: string,
  capsuleId: string,
  body: string,
  source: NoteSource
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = noteSchema.safeParse({ body, source });
  if (!parsed.success) return { error: "Notiz ist leer oder zu lang." };

  const supabase = await createClient();
  const { error } = await supabase.from("moment_notes").insert({
    photo_id: photoId,
    user_id: user.id,
    body: parsed.data.body,
    source: parsed.data.source,
  });
  if (error) return { error: error.message };

  revalidate(capsuleId, photoId);
  return {};
}

const commentSchema = z.string().trim().min(1).max(2000);

export async function addComment(
  photoId: string,
  capsuleId: string,
  body: string
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return { error: "Kommentar ist leer oder zu lang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ photo_id: photoId, user_id: user.id, body: parsed.data });
  if (error) return { error: error.message };

  revalidate(capsuleId, photoId);
  return {};
}
