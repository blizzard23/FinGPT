// The drip — the heart of Nachklang. Pure, deterministic and idempotent so it
// can be unit-tested exhaustively and run repeatedly by the cron without ever
// double-releasing.

export type DripPhoto = {
  id: string;
  quality_score: number;
  created_at: string;
};

export type DripConfig = {
  dripStartAt: Date;
  dripEndAt: Date;
  interval: "daily" | "weekly";
  photosPerRelease: number;
};

export type DripPlan = {
  /** Pending photo ids to release right now. */
  releaseIds: string[];
  /** How many photos in total should be released by `now`. */
  targetReleasedCount: number;
  /** Whether the capsule should transition to "completed". */
  isComplete: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function intervalMs(interval: DripConfig["interval"]): number {
  return interval === "weekly" ? WEEK_MS : DAY_MS;
}

// Stable ordering: release the WEAKEST photos first so the strongest are saved
// for the finale. Deterministic tie-breaks keep repeated runs identical.
function byAscendingQuality(a: DripPhoto, b: DripPhoto): number {
  if (a.quality_score !== b.quality_score) return a.quality_score - b.quality_score;
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// How many photos should have been released by `now`, given the schedule.
export function targetReleasedCount(
  now: Date,
  config: DripConfig,
  total: number
): number {
  if (total <= 0) return 0;
  if (now.getTime() < config.dripStartAt.getTime()) return 0;
  // At/after the end, everything is out — the finale.
  if (now.getTime() >= config.dripEndAt.getTime()) return total;

  const elapsed = now.getTime() - config.dripStartAt.getTime();
  const ticks = Math.floor(elapsed / intervalMs(config.interval)) + 1; // batch #1 at start
  return Math.min(ticks * config.photosPerRelease, total);
}

export function planDrip(args: {
  now: Date;
  config: DripConfig;
  released: DripPhoto[];
  pending: DripPhoto[];
}): DripPlan {
  const { now, config, released, pending } = args;
  const total = released.length + pending.length;

  const target = targetReleasedCount(now, config, total);
  const toRelease = Math.max(0, target - released.length);

  const releaseIds = [...pending]
    .sort(byAscendingQuality)
    .slice(0, toRelease)
    .map((p) => p.id);

  const isComplete = now.getTime() >= config.dripEndAt.getTime();

  return { releaseIds, targetReleasedCount: target, isComplete };
}
