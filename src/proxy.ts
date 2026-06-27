import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets, the service worker, and icons.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/|demo/).*)",
  ],
};
