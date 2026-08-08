import { describe, expect, it } from "vitest";
import { calculateWrappingPrice } from "./wrappingService";

const vehicle = { id: "v1", brand: "Fiat", model: "Toro", type: { name: "Caminhonete" } };
const material = { id: "m1", name: "Vinil", unit: "m²", sale_value: 50, roll_width: 1.52 };
const product = { id: "p1", name: "Envelopamento", calculation_mode: "wrapping" };

it("calcula peças, desperdício, dificuldade e gera quoteItemDraft", () => {
  const result = calculateWrappingPrice({ product, vehicle, material, selectedParts: [
    { id: "a", name: "Capô", area_m2: 2, waste_percent: 10, difficulty_multiplier: 1.2, install_minutes: 60 },
  ] });
  expect(result.final_total).toBe(132);
  expect(result.metrics.charged_area_m2).toBe(2.2);
  expect(result.quoteItemDraft.calculation_mode).toBe("wrapping");
  expect(result.quoteItemDraft.calculation_snapshot_json.vehicle.id).toBe("v1");
});

describe("ajustes", () => {
  it("aplica adicional e desconto sem permitir total negativo", () => {
    const result = calculateWrappingPrice({ product, vehicle, material, selectedParts: [
      { id: "a", name: "Porta", area_m2: 1, waste_percent: 0, difficulty_multiplier: 1, install_minutes: 30 },
    ], adjustments: { extra_percent: 10, extra_fixed: 5, discount: 1000 } });
    expect(result.final_total).toBe(0);
  });
});
