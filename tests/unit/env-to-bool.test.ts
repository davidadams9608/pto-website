import { describe, expect, it } from "vitest";
import { envToBool } from "@/lib/utils";

describe("envToBool", () => {
  it.each([
    ["true", true],
    ["True", true],
    ["TRUE", true],
    [" true ", true],
    ["false", false],
    ["False", false],
    ["FALSE", false],
    [undefined, false],
    ["", false],
    ["yes", false],
    ["1", false],
    ["  FALSE  ", false],
  ])("envToBool(%j) → %s", (input, expected) => {
    expect(envToBool(input)).toBe(expected);
  });
});
