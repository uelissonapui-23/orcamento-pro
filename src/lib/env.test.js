import { describe, expect, it } from "vitest";
import { getSupabaseEnv } from "./env";

describe("environment", () => {
  it("returns a stable configuration shape", () => {
    expect(getSupabaseEnv()).toEqual(expect.objectContaining({ url: expect.any(String), key: expect.any(String) }));
  });
});
