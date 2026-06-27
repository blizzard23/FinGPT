import sharp from "sharp";

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// MVP heuristic quality score in [0, 1] from resolution, brightness and a
// contrast/sharpness proxy. Deliberately isolated so it can be swapped for a
// learned model later without touching callers.
export async function computeQualityScore(buffer: Buffer): Promise<number> {
  try {
    const image = sharp(buffer, { failOn: "none" });
    const [meta, stats] = await Promise.all([image.metadata(), image.stats()]);

    const megapixels = ((meta.width ?? 0) * (meta.height ?? 0)) / 1_000_000;
    const resolutionScore = clamp(megapixels / 12); // ~12MP counts as full marks

    const meanBrightness = average(stats.channels.map((c) => c.mean)) / 255;
    // Reward well-exposed images; penalise very dark or blown-out ones.
    const brightnessScore = clamp(1 - Math.abs(meanBrightness - 0.55) / 0.55);

    // Higher per-channel stdev ≈ more contrast/detail (a cheap sharpness proxy).
    const meanStdev = average(stats.channels.map((c) => c.stdev)) / 128;
    const sharpnessScore = clamp(meanStdev);

    return clamp(
      0.4 * resolutionScore + 0.25 * brightnessScore + 0.35 * sharpnessScore
    );
  } catch {
    return 0;
  }
}
