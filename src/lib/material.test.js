import { describe, expect, it } from "vitest";
import { normalizeMaterial, validateMaterial } from "./material";

describe("material domain", () => {
  it("normalizes basic fields", () => {
    const result = normalizeMaterial({
      name: "  Vinil Branco ",
      unit: " m² ",
      cost_value: "12,50",
    });

    expect(result.name).toBe("Vinil Branco");
    expect(result.unit).toBe("m²");
    expect(result.cost_value).toBe(12.5);
  });

  it("requires roll width for wrapping material", () => {
    const result = validateMaterial({
      name: "Vinil",
      category_id: "cat",
      unit: "m²",
      use_in_wrapping: true,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.roll_width).toBeTruthy();
  });

  it("valida multiplicador e desconto do material de envelopamento", () => {
    const invalid = validateMaterial({
      name: "Vinil", category_id: "cat", unit: "m²", use_in_wrapping: true,
      roll_width: 1.38, wrapping_multiplier: 0, wrapping_discount_percent: 100,
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.wrapping_multiplier).toBeTruthy();
    expect(invalid.errors.wrapping_discount_percent).toBeTruthy();

    const valid = validateMaterial({
      name: "Vinil", category_id: "cat", unit: "m²", use_in_wrapping: true,
      roll_width: 1.38, sale_value: 50, wrapping_multiplier: 1.6, wrapping_discount_percent: 5,
    });
    expect(valid.valid).toBe(true);
  });

  it("accepts regular material without roll width", () => {
    const result = validateMaterial({
      name: "Placa PVC",
      category_id: "cat",
      unit: "un",
      cost_value: 20,
    });

    expect(result.valid).toBe(true);
  });
});
