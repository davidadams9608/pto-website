import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
]);

/** Public sub-routes that should redirect to "/" when the public site feature flag is off. */
const isPublicSubRoute = createRouteMatcher([
  "/events(.*)",
  "/about(.*)",
  "/archive(.*)",
  "/donate(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Gate public sub-routes behind the feature flag
  if (isPublicSubRoute(req) && process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE !== "true") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

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
