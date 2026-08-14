import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("mobile input focus stability", () => {
  it("keeps vehicle part rows mounted while the user types", () => {
    const source = read("../components/vehicles/VehiclePartsEditor.jsx");
    expect(source).not.toContain("part.name}`}");
    expect(source).not.toContain("normalizeVehiclePart({ ...part, [field]: value })");
    expect(source).toContain("key={part.id || `vehicle-part-${index}`}");
  });

  it("keeps quantity tier rows mounted while the user edits a range", () => {
    const source = read("../components/products/PriceTiersEditor.jsx");
    expect(source).not.toContain("tier.min_quantity}`}");
    expect(source).not.toContain("normalizeTier({ ...tier, [field]: value })");
    expect(source).toContain("key={tier.id || `price-tier-${index}`}");
  });
});
