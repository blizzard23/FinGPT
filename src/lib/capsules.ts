import { createClient } from "@/lib/supabase/server";
import type { Capsule, CapsuleMember, Photo, Profile } from "@/lib/supabase/types";

export type CapsuleMemberWithProfile = CapsuleMember & { profile: Profile };

export type CapsuleWithMeta = Capsule & {
  member_count: number;
  released_count: number;
  total_count: number;
};

// Capsules the current user belongs to, with light aggregate counts.
export async function listMyCapsules(): Promise<CapsuleWithMeta[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("capsule_members")
    .select("capsule_id");

  const ids = (memberships ?? []).map((m) => m.capsule_id);
  if (ids.length === 0) return [];

  const { data: capsules } = await supabase
    .from("capsules")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (!capsules) return [];

  const withMeta = await Promise.all(
    capsules.map(async (capsule) => {
      const [{ count: memberCount }, { count: released }, { count: total }] =
        await Promise.all([
          supabase
            .from("capsule_members")
            .select("*", { count: "exact", head: true })
            .eq("capsule_id", capsule.id),
          supabase
            .from("photos")
            .select("*", { count: "exact", head: true })
            .eq("capsule_id", capsule.id)
            .eq("status", "released"),
          supabase
            .from("photos")
            .select("*", { count: "exact", head: true })
            .eq("capsule_id", capsule.id),
        ]);

      return {
        ...capsule,
        member_count: memberCount ?? 0,
        released_count: released ?? 0,
        total_count: total ?? 0,
      };
    })
  );

  return withMeta;
}

export async function getCapsule(id: string): Promise<Capsule | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("capsules").select("*").eq("id", id).single();
  return data;
}

export async function getCapsuleMembers(
  capsuleId: string
): Promise<CapsuleMemberWithProfile[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("capsule_members")
    .select("*")
    .eq("capsule_id", capsuleId)
    .order("joined_at", { ascending: true });

  if (!members || members.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in(
      "id",
      members.map((m) => m.user_id)
    );

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return members.map((m) => ({
    ...m,
    profile: byId.get(m.user_id) ?? {
      id: m.user_id,
      display_name: "Freund:in",
      avatar_url: null,
      created_at: m.joined_at,
    },
  }));
}

export async function getReleasedPhotos(capsuleId: string): Promise<Photo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("capsule_id", capsuleId)
    .eq("status", "released")
    .order("released_at", { ascending: false });
  return data ?? [];
}

export async function isOwner(capsuleId: string, userId: string): Promise<boolean> {
  const capsule = await getCapsule(capsuleId);
  return capsule?.owner_id === userId;
}
