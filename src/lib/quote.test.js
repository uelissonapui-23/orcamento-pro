import { describe, expect, it } from "vitest";
import { createEmptyQuote, normalizeQuoteItem, quoteNumberLabel, validateQuote } from "./quote";

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

  it("formats quote number", () => {
    expect(quoteNumberLabel(12)).toBe("#0012");
  });
});
