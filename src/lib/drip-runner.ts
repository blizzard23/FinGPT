import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { planDrip, type DripConfig } from "@/lib/drip";
import type { Capsule } from "@/lib/supabase/types";

export type DripRunResult = {
  capsuleId: string;
  releasedCount: number;
  completed: boolean;
};

type Admin = ReturnType<typeof createAdminClient>;

// Runs the drip for a single capsule using the service-role client. Returns the
// number of photos released (so the caller can decide whether to push). Safe to
// call repeatedly — the underlying plan is idempotent.
export async function runDripForCapsule(
  admin: Admin,
  capsule: Capsule
): Promise<DripRunResult> {
  if (capsule.status !== "active" || !capsule.drip_start_at || !capsule.drip_end_at) {
    return { capsuleId: capsule.id, releasedCount: 0, completed: false };
  }

  const { data: photos } = await admin
    .from("photos")
    .select("id, quality_score, created_at, status")
    .eq("capsule_id", capsule.id);

  const released = (photos ?? []).filter((p) => p.status === "released");
  const pending = (photos ?? []).filter((p) => p.status === "pending");

  const config: DripConfig = {
    dripStartAt: new Date(capsule.drip_start_at),
    dripEndAt: new Date(capsule.drip_end_at),
    interval: capsule.drip_interval,
    photosPerRelease: capsule.photos_per_release,
  };

  const now = new Date();
  const plan = planDrip({ now, config, released, pending });

  if (plan.releaseIds.length > 0) {
    await admin
      .from("photos")
      .update({ status: "released", released_at: now.toISOString() })
      .in("id", plan.releaseIds);
  }

  if (plan.isComplete && capsule.status === "active") {
    await admin
      .from("capsules")
      .update({ status: "completed" })
      .eq("id", capsule.id);
  }

  return {
    capsuleId: capsule.id,
    releasedCount: plan.releaseIds.length,
    completed: plan.isComplete,
  };
}

// Runs the drip for every active capsule (the daily cron entry point).
export async function runDripForAllActive(): Promise<DripRunResult[]> {
  const admin = createAdminClient();
  const { data: capsules } = await admin
    .from("capsules")
    .select("*")
    .eq("status", "active");

  const results: DripRunResult[] = [];
  for (const capsule of capsules ?? []) {
    results.push(await runDripForCapsule(admin, capsule));
  }
  return results;
}
