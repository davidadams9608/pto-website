// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    execute: vi.fn().mockResolvedValue([]),
  },
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns status ok with database connected when DB is reachable", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.status).toBe("ok");
    expect(body.database).toBe("connected");
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("returns status degraded when DB is unreachable", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.execute).mockRejectedValueOnce(new Error("Connection refused"));

    const response = await GET();
    const body = await response.json();

    expect(body.status).toBe("degraded");
    expect(body.database).toBe("disconnected");
    expect(body.error).toBe("Connection refused");
    expect(response.status).toBe(200);
  });
});
