import { describe, expect, it } from "vitest";
import { formatProductPrice, validateProduct } from "./product";

describe("product domain", () => {
  it("requires category and name", () => {
    const result = validateProduct({});
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeTruthy();
    expect(result.errors.category_id).toBeTruthy();
  });

  it("validates square meter pricing", () => {
    const result = validateProduct({
      name: "Adesivo",
      category_id: "cat",
      calculation_mode: "square_meter",
      base_price: "85,50",
      waste_percent: "10",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects overlapping quantity tiers", () => {
    const result = validateProduct(
      {
        name: "Cartão",
        category_id: "cat",
        calculation_mode: "quantity_tier",
      },
      [
        { min_quantity: 1, max_quantity: 100, price: 60, price_mode: "total" },
        { min_quantity: 100, max_quantity: 200, price: 90, price_mode: "total" },
      ],
    );
    expect(result.valid).toBe(false);
    expect(result.errors.tiers).toBeTruthy();
  });

  it("labels manual price correctly", () => {
    expect(formatProductPrice({ calculation_mode: "manual" })).toBe("Preço informado no orçamento");
  });

  it("validates material resale configuration", () => {
    const valid = validateProduct({
      name: "Lona sem instalação",
      category_id: "cat",
      calculation_mode: "material_resale",
      default_material_id: "mat",
      configuration_json: { material_resale: { price_source: "cost", profit_mode: "markup", profit_percent: "30" } },
    });
    expect(valid.valid).toBe(true);

    const invalid = validateProduct({
      name: "Lona",
      category_id: "cat",
      calculation_mode: "material_resale",
      configuration_json: { material_resale: { price_source: "cost", profit_mode: "margin", profit_percent: "100" } },
    });
    expect(invalid.errors.material_resale_profit).toBeTruthy();
  });
});
