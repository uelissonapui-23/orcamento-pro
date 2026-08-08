import { describe, expect, it } from "vitest";
import {
  globalSearchPath,
  globalSearchTypeLabel,
  rankGlobalSearchResult,
} from "./globalSearch";

describe("global search helpers", () => {
  it("ranks exact match first", () => {
    expect(rankGlobalSearchResult({ title: "Banner" }, "banner")).toBe(100);
    expect(rankGlobalSearchResult({ title: "Banner Premium" }, "banner")).toBe(80);
  });

  it("builds direct quote path", () => {
    expect(globalSearchPath({ type: "quote", id: "abc" })).toBe("/orcamentos/abc");
  });

  it("labels result type", () => {
    expect(globalSearchTypeLabel("material")).toBe("Material");
  });
});
