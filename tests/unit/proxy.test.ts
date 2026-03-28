// @vitest-environment node
import { createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mirror the protected route patterns from proxy.ts
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
]);

const isPublicSubRoute = createRouteMatcher([
  "/events(.*)",
  "/about(.*)",
  "/archive(.*)",
  "/donate(.*)",
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

describe("proxy feature flag gating", () => {
  describe("public sub-routes matched by feature flag gate", () => {
    it.each([
      "/events",
      "/events/some-event-id",
      "/about",
      "/archive",
      "/archive/newsletters/123",
      "/donate",
    ])("%s is matched as a public sub-route", (path) => {
      expect(isPublicSubRoute(mockRequest(path))).toBe(true);
    });
  });

  describe("routes NOT gated by feature flag", () => {
    it.each([
      "/",
      "/api/events",
      "/api/sponsors",
      "/api/health",
      "/admin/dashboard",
    ])("%s is not a gated public sub-route", (path) => {
      expect(isPublicSubRoute(mockRequest(path))).toBe(false);
    });
  });

  describe("redirect logic", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("redirects public sub-routes when flag is not set", () => {
      vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "");
      const req = mockRequest("/events");
      const shouldRedirect = isPublicSubRoute(req) && process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE !== "true";
      expect(shouldRedirect).toBe(true);
    });

    it("redirects public sub-routes when flag is false", () => {
      vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
      const req = mockRequest("/events");
      const shouldRedirect = isPublicSubRoute(req) && process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE !== "true";
      expect(shouldRedirect).toBe(true);
    });

    it("does NOT redirect public sub-routes when flag is true", () => {
      vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
      const req = mockRequest("/events");
      const shouldRedirect = isPublicSubRoute(req) && process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE !== "true";
      expect(shouldRedirect).toBe(false);
    });

    it("does NOT redirect homepage regardless of flag", () => {
      vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
      const req = mockRequest("/");
      const shouldRedirect = isPublicSubRoute(req) && process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE !== "true";
      expect(shouldRedirect).toBe(false);
    });

    it("does NOT redirect API routes regardless of flag", () => {
      vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
      const req = mockRequest("/api/events");
      const shouldRedirect = isPublicSubRoute(req) && process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE !== "true";
      expect(shouldRedirect).toBe(false);
    });

    it("does NOT redirect admin routes regardless of flag", () => {
      vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
      const req = mockRequest("/admin/dashboard");
      const shouldRedirect = isPublicSubRoute(req) && process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE !== "true";
      expect(shouldRedirect).toBe(false);
    });
  });
});

// Cache the real createRouteMatcher before any mocks
const { createRouteMatcher: realCreateRouteMatcher } = await import("@clerk/nextjs/server");

describe("proxy function — auth.protect() and redirect integration", () => {
  let protectMock: ReturnType<typeof vi.fn>;
  let proxyHandler: (req: NextRequest) => Promise<NextResponse | undefined>;

  beforeEach(async () => {
    vi.resetModules();

    protectMock = vi.fn().mockResolvedValue(undefined);

    // Mock Clerk's clerkMiddleware to capture the callback and invoke it with our mock auth
    vi.doMock("@clerk/nextjs/server", () => ({
      clerkMiddleware: (callback: (auth: { protect: typeof protectMock }, req: NextRequest) => Promise<NextResponse | undefined>) => {
        return (req: NextRequest) => callback({ protect: protectMock }, req);
      },
      createRouteMatcher: realCreateRouteMatcher,
    }));

    const proxyModule = await import("@/proxy");
    proxyHandler = proxyModule.default as (req: NextRequest) => Promise<NextResponse | undefined>;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("calls auth.protect() for admin page routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    await proxyHandler(mockRequest("/admin/dashboard"));
    expect(protectMock).toHaveBeenCalled();
  });

  it("calls auth.protect() for admin API routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    await proxyHandler(mockRequest("/api/admin/events"));
    expect(protectMock).toHaveBeenCalled();
  });

  it("does NOT call auth.protect() for public routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    await proxyHandler(mockRequest("/events"));
    expect(protectMock).not.toHaveBeenCalled();
  });

  it("redirects /events to / when flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    const response = await proxyHandler(mockRequest("/events"));
    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(307);
    expect(new URL(response!.headers.get("location")!).pathname).toBe("/");
  });

  it("does NOT redirect /events when flag is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    const response = await proxyHandler(mockRequest("/events"));
    expect(response).toBeUndefined();
  });

  it("redirects /donate to / when flag is off, without calling auth.protect()", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    const response = await proxyHandler(mockRequest("/donate"));
    expect(response?.status).toBe(307);
    expect(protectMock).not.toHaveBeenCalled();
  });

  it("calls auth.protect() for admin routes even when flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    await proxyHandler(mockRequest("/admin/events"));
    expect(protectMock).toHaveBeenCalled();
  });
});
