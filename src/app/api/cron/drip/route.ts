import { NextResponse, type NextRequest } from "next/server";
import { runDripForAllActive } from "@/lib/drip-runner";
import { notifyCapsuleRelease } from "@/lib/push";

export const runtime = "nodejs";

// Daily Vercel Cron entry point. Releases due photos for all active capsules
// and sends exactly one bundled push per capsule that had a release.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runDripForAllActive();

  // One bundled notification per capsule that actually released something.
  await Promise.all(
    results
      .filter((r) => r.releasedCount > 0)
      .map((r) => notifyCapsuleRelease(r.capsuleId))
  );

  return NextResponse.json({ ran: results.length, results });
}
