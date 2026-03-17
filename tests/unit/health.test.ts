import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns status ok and a valid timestamp", async () => {
    const response = GET();
    const body = await response.json();

    expect(body.status).toBe("ok");
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});
