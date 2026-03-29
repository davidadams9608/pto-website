// @vitest-environment node
import { createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mirror the route patterns from proxy.ts
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

const isPublicSubRoute = createRouteMatcher([
  "/events(.*)",
  "/about(.*)",
  "/archive(.*)",
  "/donate(.*)",
]);

function mockRequest(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

// ── Route matching tests ──────────────────────────────────────────────────

describe("proxy route protection", () => {
  describe("public routes — should NOT match admin", () => {
    it.each([
      "/",
      "/events",
      "/archive",
      "/sponsors",
      "/donate",
      "/api/health",
      "/api/public/events",
    ])("%s is public", (path) => {
      expect(isAdminRoute(mockRequest(path))).toBe(false);
    });
  });

  describe("admin routes — should match admin", () => {
    it.each([
      "/admin/dashboard",
      "/admin/events",
      "/admin/newsletters",
      "/admin/minutes",
      "/admin/sponsors",
      "/admin/settings",
      "/api/admin/events",
      "/api/admin/newsletters",
    ])("%s is admin", (path) => {
      expect(isAdminRoute(mockRequest(path))).toBe(true);
    });
  });
});

// ── Feature flag matching tests ───────────────────────────────────────────

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
});

// ── Redirect logic (unit-level, no Clerk mock needed) ─────────────────────

describe("proxy redirect logic", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects public sub-routes when flag is not set", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "");
    const req = mockRequest("/events");
    const shouldRedirect =
      isPublicSubRoute(req) &&
      process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE?.toLowerCase().trim() !== "true";
    expect(shouldRedirect).toBe(true);
  });

  it("redirects public sub-routes when flag is false", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    const req = mockRequest("/events");
    const shouldRedirect =
      isPublicSubRoute(req) &&
      process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE?.toLowerCase().trim() !== "true";
    expect(shouldRedirect).toBe(true);
  });

  it("does NOT redirect public sub-routes when flag is true", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    const req = mockRequest("/events");
    const shouldRedirect =
      isPublicSubRoute(req) &&
      process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE?.toLowerCase().trim() !== "true";
    expect(shouldRedirect).toBe(false);
  });

  it("does NOT redirect homepage regardless of flag", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    const req = mockRequest("/");
    const shouldRedirect =
      isPublicSubRoute(req) &&
      process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE?.toLowerCase().trim() !== "true";
    expect(shouldRedirect).toBe(false);
  });

  it("does NOT redirect API routes regardless of flag", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    const req = mockRequest("/api/events");
    const shouldRedirect =
      isPublicSubRoute(req) &&
      process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE?.toLowerCase().trim() !== "true";
    expect(shouldRedirect).toBe(false);
  });

  it("does NOT redirect admin routes regardless of flag", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    const req = mockRequest("/admin/dashboard");
    const shouldRedirect =
      isPublicSubRoute(req) &&
      process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE?.toLowerCase().trim() !== "true";
    expect(shouldRedirect).toBe(false);
  });
});

// ── Feature flag case-insensitivity tests ─────────────────────────────────

describe("feature flag case-insensitive parsing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ["true", false],
    ["True", false],
    ["TRUE", false],
    [" true ", false],
    ["false", true],
    ["False", true],
    ["FALSE", true],
    ["", true],
  ])('flag value %j → should redirect: %s', (flagValue, shouldRedirect) => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", flagValue);
    const result =
      process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE?.toLowerCase().trim() !== "true";
    expect(result).toBe(shouldRedirect);
  });

  it("undefined flag → should redirect", () => {
    delete process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE;
    const val = process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SITE as string | undefined;
    const result = val?.toLowerCase().trim() !== "true";
    expect(result).toBe(true);
  });
});

// ── Integration tests (mocked Clerk) ──────────────────────────────────────

// Cache the real createRouteMatcher before any mocks
const { createRouteMatcher: realCreateRouteMatcher } = await import("@clerk/nextjs/server");

/** Minimal NextFetchEvent stub for the proxy's second parameter. */
const stubEvent = {} as import("next/server").NextFetchEvent;

describe("proxy function — integration", () => {
  let protectMock: ReturnType<typeof vi.fn>;
  let clerkMiddlewareMock: ReturnType<typeof vi.fn>;
  let proxyHandler: (req: NextRequest, event: import("next/server").NextFetchEvent) => Promise<NextResponse | undefined>;

  beforeEach(async () => {
    vi.resetModules();

    protectMock = vi.fn().mockResolvedValue(undefined);

    // Mock Clerk's clerkMiddleware to capture the callback and invoke it with our mock auth
    clerkMiddlewareMock = vi.fn().mockImplementation(
      (callback: (auth: { protect: typeof protectMock }, req: NextRequest) => Promise<NextResponse | undefined>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return (req: NextRequest, _event: unknown) => callback({ protect: protectMock }, req);
      },
    );

    vi.doMock("@clerk/nextjs/server", () => ({
      clerkMiddleware: clerkMiddlewareMock,
      createRouteMatcher: realCreateRouteMatcher,
    }));

    const proxyModule = await import("@/proxy");
    proxyHandler = proxyModule.default as typeof proxyHandler;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // ── Admin routes go through Clerk ───────────────────────────────────────

  it("calls auth.protect() for admin page routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    await proxyHandler(mockRequest("/admin/dashboard"), stubEvent);
    expect(protectMock).toHaveBeenCalled();
  });

  it("calls auth.protect() for admin API routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    await proxyHandler(mockRequest("/api/admin/events"), stubEvent);
    expect(protectMock).toHaveBeenCalled();
  });

  it("calls auth.protect() for admin routes even when flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    await proxyHandler(mockRequest("/admin/events"), stubEvent);
    expect(protectMock).toHaveBeenCalled();
  });

  // ── Public routes do NOT go through Clerk ───────────────────────────────

  it("does NOT invoke clerkMiddleware for public routes (flag on)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    const response = await proxyHandler(mockRequest("/events"), stubEvent);
    expect(protectMock).not.toHaveBeenCalled();
    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(200);
  });

  it("does NOT invoke clerkMiddleware for public routes (flag off, redirects)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    const response = await proxyHandler(mockRequest("/events"), stubEvent);
    expect(protectMock).not.toHaveBeenCalled();
    expect(response?.status).toBe(307);
    expect(new URL(response!.headers.get("location")!).pathname).toBe("/");
  });

  it("does NOT invoke clerkMiddleware for homepage", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    const response = await proxyHandler(mockRequest("/"), stubEvent);
    expect(protectMock).not.toHaveBeenCalled();
    expect(response).toBeInstanceOf(NextResponse);
  });

  // ── Feature flag redirect behavior ──────────────────────────────────────

  it("redirects /events to / when flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    const response = await proxyHandler(mockRequest("/events"), stubEvent);
    expect(response?.status).toBe(307);
    expect(new URL(response!.headers.get("location")!).pathname).toBe("/");
  });

  it("does NOT redirect /events when flag is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "true");
    const response = await proxyHandler(mockRequest("/events"), stubEvent);
    expect(response?.status).toBe(200);
  });

  it("redirects /donate to / when flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "false");
    const response = await proxyHandler(mockRequest("/donate"), stubEvent);
    expect(response?.status).toBe(307);
    expect(protectMock).not.toHaveBeenCalled();
  });

  // ── Case-insensitive flag integration ───────────────────────────────────

  it("treats 'True' as enabled (case-insensitive)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "True");
    const response = await proxyHandler(mockRequest("/events"), stubEvent);
    expect(response?.status).toBe(200);
  });

  it("treats 'TRUE' as enabled (case-insensitive)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "TRUE");
    const response = await proxyHandler(mockRequest("/events"), stubEvent);
    expect(response?.status).toBe(200);
  });

  it("treats ' true ' as enabled (whitespace-trimmed)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", " true ");
    const response = await proxyHandler(mockRequest("/events"), stubEvent);
    expect(response?.status).toBe(200);
  });

  it("treats 'False' as disabled (redirects)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PUBLIC_SITE", "False");
    const response = await proxyHandler(mockRequest("/events"), stubEvent);
    expect(response?.status).toBe(307);
  });
});
