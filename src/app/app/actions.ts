"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { generateInviteToken } from "@/lib/token";

const createSchema = z.object({
  name: z.string().trim().min(1, "Gib deinem Erlebnis einen Namen.").max(80),
  drip_interval: z.enum(["daily", "weekly"]),
  duration_days: z.coerce.number().int().min(1).max(90),
  photos_per_release: z.coerce.number().int().min(1).max(10),
});

export type CreateCapsuleState = { error?: string };

export async function createCapsule(
  _prev: CreateCapsuleState,
  formData: FormData
): Promise<CreateCapsuleState> {
  const user = await requireUser();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    drip_interval: formData.get("drip_interval"),
    duration_days: formData.get("duration_days"),
    photos_per_release: formData.get("photos_per_release"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const { name, drip_interval, duration_days, photos_per_release } = parsed.data;
  const supabase = await createClient();

  const start = new Date();
  const end = new Date(start.getTime() + duration_days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("capsules")
    .insert({
      name,
      owner_id: user.id,
      status: "draft",
      drip_interval,
      photos_per_release,
      drip_start_at: start.toISOString(),
      drip_end_at: end.toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Kapsel konnte nicht erstellt werden." };
  }

  revalidatePath("/app");
  redirect(`/app/c/${data.id}`);
}

// Creates (or reuses) an invite for the capsule and returns the shareable URL.
export async function createInviteLink(capsuleId: string): Promise<string> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("capsule_invites")
    .select("token")
    .eq("capsule_id", capsuleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let token = existing?.token;

  if (!token) {
    token = generateInviteToken();
    const { error } = await supabase.from("capsule_invites").insert({
      capsule_id: capsuleId,
      token,
      created_by: user.id,
    });
    if (error) throw new Error(error.message);
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/join/${token}`;
}

export async function startCapsule(capsuleId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: capsule } = await supabase
    .from("capsules")
    .select("owner_id, status")
    .eq("id", capsuleId)
    .single();

  if (!capsule || capsule.owner_id !== user.id) {
    throw new Error("Nur der Ersteller kann die Kapsel starten.");
  }
  if (capsule.status !== "draft") return;

  // Start the drip clock now.
  await supabase
    .from("capsules")
    .update({ status: "active", drip_start_at: new Date().toISOString() })
    .eq("id", capsuleId);

  revalidatePath(`/app/c/${capsuleId}`);
}
