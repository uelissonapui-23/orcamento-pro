import { describe, expect, it } from "vitest";
import {
  buildBusinessSnapshot,
  buildPdfFilename,
  businessDisplayName,
  formatAddress,
  formatContact,
  quoteItemUnitPrice,
  quotePdfViewModel,
} from "./quotePdf";

describe("quote PDF helpers", () => {
  it("builds stable business snapshot", () => {
    const snapshot = buildBusinessSnapshot({
      trade_name: "Minha Empresa",
      primary_color: "#FF0000",
      ignored: "x",
    });
    expect(snapshot.trade_name).toBe("Minha Empresa");
    expect(snapshot.primary_color).toBe("#FF0000");
    expect(snapshot.pdf_logo_path).toBe("");
    expect(snapshot.ignored).toBeUndefined();
  });

  it("prefers trade name", () => {
    expect(businessDisplayName({ trade_name: "Loja", legal_name: "Razão" })).toBe("Loja");
  });

  it("formats address", () => {
    expect(formatAddress({ street: "Rua A", address_number: "10", city: "Goiânia", state: "GO" }))
      .toContain("Rua A, 10");
  });

  it("omits empty address and contact labels", () => {
    expect(formatAddress({ street: "Av. Acre", address_number: "1065", district: "Vila Nova", city: "Apuí", postal_code: "69265-000" }))
      .toBe("Av. Acre, 1065\nBairro: Vila Nova · Apuí · CEP: 69265-000");
    expect(formatContact({ phone: "", whatsapp: "97991978597", email: "" }))
      .toBe("WhatsApp: 97991978597");
    expect(formatContact({})).toBe("");
  });

  it("keeps the lightweight PDF logo in the historical snapshot", () => {
    const snapshot = buildBusinessSnapshot({
      logo_path: "workspace/logos/original.png",
      pdf_logo_path: "workspace/logos/pdf/light.webp",
    });
    expect(snapshot.pdf_logo_path).toBe("workspace/logos/pdf/light.webp");
  });

  it("shows the commercial price of one sold unit, not the technical pricing base", () => {
    expect(quoteItemUnitPrice({ quantity: 4, total_price: 100 })).toBe(25);
    // Em itens por m²/metro, unit_price pode ser a tarifa técnica do cálculo.
    // O PDF deve mostrar quanto custa cada unidade final: 100 / 4 = 25.
    expect(quoteItemUnitPrice({ quantity: 4, total_price: 100, unit_price: 30 })).toBe(25);
    expect(quoteItemUnitPrice({ quantity: 3, total_price: 100 })).toBe(33.33);
  });

  it("shows delivery as a deadline counted after approval", () => {
    const vm = quotePdfViewModel({
      issue_date: "2026-08-13",
      expected_delivery_date: "2026-08-20",
      client_snapshot_json: {},
    });
    expect(vm.deliveryDays).toBe(7);
    expect(vm.deliveryTerm).toBe("7 dias após aprovação");
  });

  it("creates filesystem-safe filename", () => {
    const name = buildPdfFilename(
      { quote_number: 12, client_snapshot_json: { name: "João & Cia" } },
      { trade_name: "Empresa" },
    );
    expect(name).toBe("orcamento-0012-joao-cia.pdf");
  });
});
