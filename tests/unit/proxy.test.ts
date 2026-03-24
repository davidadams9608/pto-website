// @vitest-environment node
import { createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

// Mirror the protected route patterns from proxy.ts
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
]);

function mockRequest(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

describe("proxy route protection", () => {
  describe("public routes — should NOT be protected", () => {
    it.each([
      "/",
      "/events",
      "/archive",
      "/sponsors",
      "/donate",
      "/api/health",
      "/api/public/events",
    ])("%s is public", (path) => {
      expect(isProtectedRoute(mockRequest(path))).toBe(false);
    });
  });

  describe("admin routes — should be protected", () => {
    it.each([
      "/admin/dashboard",
      "/admin/events",
      "/admin/newsletters",
      "/admin/minutes",
      "/admin/sponsors",
      "/admin/settings",
      "/api/admin/events",
      "/api/admin/newsletters",
    ])("%s is protected", (path) => {
      expect(isProtectedRoute(mockRequest(path))).toBe(true);
    });
  });
});
