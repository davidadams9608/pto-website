import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { envToBool } from "@/lib/utils";

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

/** Public sub-routes that should redirect to "/" when the public site feature flag is off. */
const isPublicSubRoute = createRouteMatcher([
  "/events(.*)",
  "/about(.*)",
  "/archive(.*)",
  "/donate(.*)",
]);

/** Clerk middleware — only invoked for admin routes. */
const handleAdminRoute = clerkMiddleware(async (auth) => {
  await auth.protect();
});

/** Feature-flag gate for public routes (no Clerk involved). */
function handlePublicRoute(request: NextRequest): NextResponse {
  const isPublicSiteEnabled = envToBool(process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE);

  if (!isPublicSiteEnabled && isPublicSubRoute(request)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (isAdminRoute(request)) {
    return handleAdminRoute(request, event);
  }

  return handlePublicRoute(request);
}

export const config = {
  matcher: [
    // Admin routes — Clerk auth
    "/admin(.*)",
    "/api/admin(.*)",
    // Public sub-routes — feature flag gate
    "/events(.*)",
    "/about(.*)",
    "/archive(.*)",
    "/donate(.*)",
  ],
};
