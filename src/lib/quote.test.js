import { describe, expect, it } from "vitest";
import { applyQuoteItemDiscount, createEmptyQuote, normalizeQuoteItem, quoteNumberLabel, validateQuote } from "./quote";
import { addDaysToIsoDate, quoteDeliveryDays } from "./quoteDefaults";

describe("quote domain", () => {
  it("creates quote from defaults", () => {
    const quote = createEmptyQuote({ issue_date: "2026-08-08", valid_until: "2026-08-15" });
    expect(quote.issue_date).toBe("2026-08-08");
    expect(quote.status).toBe("draft");
  });

  it("validates minimum quote content", () => {
    const result = validateQuote({ client_id: "", issue_date: "", valid_until: "", items: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.client_id).toBeTruthy();
    expect(result.errors.items).toBeTruthy();
  });

  it("normalizes quote item values", () => {
    const item = normalizeQuoteItem({ description: "Banner", quantity: "2", total_price: "120.50" });
    expect(item.quantity).toBe(2);
    expect(item.total_price).toBe(120.5);
  });

  it("keeps item discount value and percentage synchronized", () => {
    const item = normalizeQuoteItem({ description: "Banner", quantity: 2, total_price: 200 });
    const byPercent = applyQuoteItemDiscount(item, "percent", 15);
    expect(byPercent.item_discount_value).toBe(30);
    expect(byPercent.total_price).toBe(170);
    const byValue = applyQuoteItemDiscount(byPercent, "fixed", 50);
    expect(byValue.item_discount_percent).toBe(25);
    expect(byValue.total_price).toBe(150);
    expect(byValue.calculation_snapshot_json.item_discount.gross_total_price).toBe(200);
  });

  it("keeps delivery as a number of days instead of a promised calendar date", () => {
    expect(addDaysToIsoDate("2026-08-13", 7)).toBe("2026-08-20");
    expect(quoteDeliveryDays({ issue_date: "2026-08-13", expected_delivery_date: "2026-08-20" })).toBe(7);
  });

  it("formats quote number", () => {
    expect(quoteNumberLabel(12)).toBe("#0012");
  });
});
