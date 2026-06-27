import { describe, it, expect } from "vitest";
import { planDrip, targetReleasedCount, type DripPhoto, type DripConfig } from "./drip";

const START = new Date("2026-01-01T00:00:00.000Z");

function makeConfig(overrides: Partial<DripConfig> = {}): DripConfig {
  return {
    dripStartAt: START,
    dripEndAt: new Date("2026-01-15T00:00:00.000Z"), // 14 days
    interval: "daily",
    photosPerRelease: 1,
    ...overrides,
  };
}

// 30 photos with ascending, well-separated quality scores.
function makePhotos(n: number): DripPhoto[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${String(i).padStart(2, "0")}`,
    quality_score: i / n,
    created_at: new Date(START.getTime() + i * 1000).toISOString(),
  }));
}

function dayAfterStart(days: number): Date {
  return new Date(START.getTime() + days * 24 * 60 * 60 * 1000);
}

describe("targetReleasedCount", () => {
  it("releases nothing before the start", () => {
    const before = new Date(START.getTime() - 1000);
    expect(targetReleasedCount(before, makeConfig(), 30)).toBe(0);
  });

  it("releases the first batch at the start", () => {
    expect(targetReleasedCount(START, makeConfig({ photosPerRelease: 2 }), 30)).toBe(2);
  });

  it("grows by photos_per_release each interval", () => {
    const config = makeConfig({ photosPerRelease: 2 });
    expect(targetReleasedCount(dayAfterStart(0), config, 30)).toBe(2);
    expect(targetReleasedCount(dayAfterStart(1), config, 30)).toBe(4);
    expect(targetReleasedCount(dayAfterStart(3), config, 30)).toBe(8);
  });

  it("releases everything at/after the end", () => {
    const config = makeConfig();
    expect(targetReleasedCount(config.dripEndAt, config, 30)).toBe(30);
    expect(targetReleasedCount(dayAfterStart(100), config, 30)).toBe(30);
  });

  it("never exceeds the total", () => {
    const config = makeConfig({ photosPerRelease: 10 });
    expect(targetReleasedCount(dayAfterStart(13), config, 30)).toBe(30);
  });
});

describe("planDrip", () => {
  it("releases the correct number for a given day", () => {
    const pending = makePhotos(30);
    const plan = planDrip({ now: START, config: makeConfig(), released: [], pending });
    expect(plan.releaseIds).toHaveLength(1);
  });

  it("is idempotent: re-running the same day releases nothing more", () => {
    const all = makePhotos(30);
    const config = makeConfig({ photosPerRelease: 3 });

    const first = planDrip({ now: dayAfterStart(2), config, released: [], pending: all });
    expect(first.releaseIds).toHaveLength(9); // 3 ticks * 3

    const releasedSet = new Set(first.releaseIds);
    const released = all.filter((p) => releasedSet.has(p.id));
    const pending = all.filter((p) => !releasedSet.has(p.id));

    const second = planDrip({ now: dayAfterStart(2), config, released, pending });
    expect(second.releaseIds).toHaveLength(0);
  });

  it("never double-releases across a sequence of days", () => {
    const all = makePhotos(30);
    const config = makeConfig({ photosPerRelease: 2 });
    let released: DripPhoto[] = [];
    let pending = all;
    const seen = new Set<string>();

    for (let day = 0; day <= 14; day += 1) {
      const plan = planDrip({ now: dayAfterStart(day), config, released, pending });
      for (const id of plan.releaseIds) {
        expect(seen.has(id)).toBe(false); // never released twice
        seen.add(id);
      }
      const releasedSet = new Set([...released.map((p) => p.id), ...plan.releaseIds]);
      released = all.filter((p) => releasedSet.has(p.id));
      pending = all.filter((p) => !releasedSet.has(p.id));
    }

    expect(seen.size).toBe(30); // everything released exactly once
    expect(pending).toHaveLength(0);
  });

  it("saves the best photos for the finale", () => {
    const all = makePhotos(30);
    const config = makeConfig({ photosPerRelease: 2 });

    // Release everything up to the day before the end.
    let released: DripPhoto[] = [];
    let pending = all;
    for (let day = 0; day < 13; day += 1) {
      const plan = planDrip({ now: dayAfterStart(day), config, released, pending });
      const releasedSet = new Set([...released.map((p) => p.id), ...plan.releaseIds]);
      released = all.filter((p) => releasedSet.has(p.id));
      pending = all.filter((p) => !releasedSet.has(p.id));
    }

    // Whatever remains for the finale must be the highest-quality photos.
    const finaleMin = Math.min(...pending.map((p) => p.quality_score));
    const releasedMax = Math.max(...released.map((p) => p.quality_score));
    expect(finaleMin).toBeGreaterThanOrEqual(releasedMax);
  });

  it("marks the capsule complete only at/after the end", () => {
    const config = makeConfig();
    const pending = makePhotos(5);
    expect(
      planDrip({ now: dayAfterStart(5), config, released: [], pending }).isComplete
    ).toBe(false);
    expect(
      planDrip({ now: config.dripEndAt, config, released: [], pending }).isComplete
    ).toBe(true);
  });

  it("handles an empty capsule", () => {
    const plan = planDrip({ now: START, config: makeConfig(), released: [], pending: [] });
    expect(plan.releaseIds).toHaveLength(0);
    expect(plan.targetReleasedCount).toBe(0);
  });
});
