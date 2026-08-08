import { describe, expect, it } from "vitest";
import { priceProductForQuote } from "./quoteItemPricingService";

describe("quote item pricing adapter", () => {
  it("builds the future quote item draft from the engine", () => {
    const result = priceProductForQuote({
      product: {
        id: "p1",
        name: "Banner",
        calculation_mode: "square_meter",
        base_price: 60,
        minimum_price: 0,
        waste_percent: 0,
      },
      formValues: { width: 2, height: 1, quantity: 3 },
    });

    expect(result.quoteItemDraft.product_id).toBe("p1");
    expect(result.quoteItemDraft.area).toBe(6);
    expect(result.quoteItemDraft.total_price).toBe(360);
    expect(result.quoteItemDraft.calculation_snapshot_json.engine_version).toBe(1);
  });
});
