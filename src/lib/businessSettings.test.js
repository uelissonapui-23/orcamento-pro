import { describe, expect, it } from "vitest";
import { normalizeBusinessSettings, normalizeHexColor, validateBusinessSettings } from "./businessSettings";
import { buildQuoteDefaults } from "./quoteDefaults";

describe("business settings", () => {
  it("normalizes bounds and color", () => {
    const result = normalizeBusinessSettings({
      trade_name: "  Minha Empresa  ",
      primary_color: "#12abEF",
      default_quote_validity_days: 999,
      default_delivery_days: -2,
    });

    expect(result.trade_name).toBe("Minha Empresa");
    expect(result.primary_color).toBe("#12ABEF");
    expect(result.default_quote_validity_days).toBe(365);
    expect(result.default_delivery_days).toBe(0);
    expect(result.pdf_logo_path).toBe("");
  });

  it("falls back to a safe brand color", () => {
    expect(normalizeHexColor("red")).toBe("#111827");
  });

  it("requires a business name", () => {
    expect(validateBusinessSettings({}).valid).toBe(false);
  });

  it("builds future quote defaults without duplicating editor logic", () => {
    const defaults = buildQuoteDefaults(
      {
        default_quote_validity_days: 10,
        default_delivery_days: 5,
        default_payment_terms: "50% na entrada",
        default_quote_terms: "Validade comercial.",
      },
      new Date(2026, 7, 8),
    );

    expect(defaults.issue_date).toBe("2026-08-08");
    expect(defaults.valid_until).toBe("2026-08-18");
    expect(defaults.expected_delivery_date).toBe("2026-08-13");
    expect(defaults.payment_terms_snapshot).toBe("50% na entrada");
    expect(defaults.terms_snapshot).toBe("Validade comercial.");
  });
});
