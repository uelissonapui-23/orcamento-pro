import { describe, expect, it } from "vitest";
import {
  PRICING_ENGINE_VERSION,
  PricingError,
  calculateProductPrice,
  calculateQuoteTotals,
} from "./pricingService";

describe("pricing engine", () => {
  it("calculates square meters with waste and minimum", () => {
    const result = calculateProductPrice({
      product: {
        id: "p1",
        name: "Adesivo",
        calculation_mode: "square_meter",
        base_price: 85,
        minimum_price: 50,
        waste_percent: 10,
        unit_label: "m²",
      },
      input: { width: 1.2, height: 2, quantity: 2 },
    });

    expect(result.final_total).toBe(448.8);
    expect(result.metrics.total_area_m2).toBe(4.8);
    expect(result.metrics.charged_area_m2).toBe(5.28);
    expect(result.snapshot.engine_version).toBe(PRICING_ENGINE_VERSION);
  });

  it("applies minimum price", () => {
    const result = calculateProductPrice({
      product: {
        calculation_mode: "square_meter",
        base_price: 10,
        minimum_price: 50,
        waste_percent: 0,
      },
      input: { width: 1, height: 1, quantity: 1 },
    });

    expect(result.metrics.raw_total).toBe(10);
    expect(result.metrics.minimum_applied).toBe(true);
    expect(result.final_total).toBe(50);
  });

  it("calculates linear meter", () => {
    const result = calculateProductPrice({
      product: { calculation_mode: "linear_meter", base_price: 35, minimum_price: 0 },
      input: { length: 3.5, quantity: 2 },
    });

    expect(result.metrics.total_length_m).toBe(7);
    expect(result.final_total).toBe(245);
  });

  it("calculates units", () => {
    const result = calculateProductPrice({
      product: { calculation_mode: "unit", base_price: 12.5, minimum_price: 0 },
      input: { quantity: 4 },
    });

    expect(result.final_total).toBe(50);
    expect(result.unit_price).toBe(12.5);
  });

  it("calculates total-price quantity tier", () => {
    const result = calculateProductPrice({
      product: { calculation_mode: "quantity_tier" },
      input: { quantity: 500 },
      tiers: [
        { min_quantity: 1, max_quantity: 249, price: 60, price_mode: "total" },
        { min_quantity: 250, max_quantity: 499, price: 95, price_mode: "total" },
        { min_quantity: 500, max_quantity: 999, price: 140, price_mode: "total" },
      ],
    });

    expect(result.final_total).toBe(140);
    expect(result.metrics.tier.min_quantity).toBe(500);
  });

  it("calculates unit-price quantity tier", () => {
    const result = calculateProductPrice({
      product: { calculation_mode: "quantity_tier" },
      input: { quantity: 20 },
      tiers: [{ min_quantity: 1, max_quantity: 50, price: 4.5, price_mode: "unit" }],
    });

    expect(result.final_total).toBe(90);
    expect(result.unit_price).toBe(4.5);
  });

  it("throws when quantity is outside tiers", () => {
    expect(() =>
      calculateProductPrice({
        product: { calculation_mode: "quantity_tier" },
        input: { quantity: 500 },
        tiers: [{ min_quantity: 1, max_quantity: 100, price: 60, price_mode: "total" }],
      }),
    ).toThrow(PricingError);
  });

  it("supports fixed price with and without quantity multiplication", () => {
    const once = calculateProductPrice({
      product: {
        calculation_mode: "fixed",
        base_price: 150,
        configuration_json: { fixed_multiplies_quantity: false },
      },
      input: { quantity: 3 },
    });

    const multiplied = calculateProductPrice({
      product: {
        calculation_mode: "fixed",
        base_price: 150,
        configuration_json: { fixed_multiplies_quantity: true },
      },
      input: { quantity: 3 },
    });

    expect(once.final_total).toBe(150);
    expect(multiplied.final_total).toBe(450);
  });

  it("calculates manual price", () => {
    const result = calculateProductPrice({
      product: { calculation_mode: "manual" },
      input: { quantity: 2, manual_price: 350 },
    });

    expect(result.final_total).toBe(350);
    expect(result.unit_price).toBe(175);
  });

  it("delegates wrapping to the future wrapping service", () => {
    const result = calculateProductPrice({
      product: { id: "wrap", name: "Envelopamento", calculation_mode: "wrapping" },
    });

    expect(result.status).toBe("requires_wizard");
    expect(result.snapshot.delegated_to).toBe("wrappingService");
  });

  it("calculates quote subtotal, fixed discount and surcharge", () => {
    const result = calculateQuoteTotals({
      items: [{ total_price: 100 }, { total_price: 250.5 }],
      discountType: "fixed",
      discountValue: 25,
      surchargeValue: 10,
    });

    expect(result.subtotal).toBe(350.5);
    expect(result.total).toBe(335.5);
  });

  it("calculates percentage discount safely", () => {
    const result = calculateQuoteTotals({
      items: [{ total_price: 1000 }],
      discountType: "percent",
      discountValue: 10,
    });

    expect(result.discount_total).toBe(100);
    expect(result.total).toBe(900);
  });

  it("rejects invalid negative and zero inputs", () => {
    expect(() =>
      calculateProductPrice({
        product: { calculation_mode: "unit", base_price: 10 },
        input: { quantity: 0 },
      }),
    ).toThrow(PricingError);
  });
});

describe("fluid curve pricing", () => {
  it("interpolates multiplier continuously between configured points", () => {
    const product = { calculation_mode: "fluid_curve", minimum_price: 0, configuration_json: { fluid_curve: { measure_type: "square_meter", base_cost: 50, points: [{ measure: 0.01, multiplier: 16 }, { measure: 1, multiplier: 3 }] } } };
    const start = calculateProductPrice({ product, input: { width: .1, height: .1, quantity: 1 } });
    const middle = calculateProductPrice({ product, input: { width: .5, height: 1, quantity: 1 } });
    const end = calculateProductPrice({ product, input: { width: 1, height: 1, quantity: 1 } });
    expect(start.final_total).toBe(8);
    expect(middle.final_total).toBeGreaterThan(start.final_total);
    expect(middle.final_total).toBeLessThan(end.final_total);
    expect(middle.final_total).toBeCloseTo(78.28, 2);
    expect(middle.metrics.curve_multiplier).toBeCloseTo(3.1313, 4);
    expect(end.final_total).toBe(150);
  });
});
