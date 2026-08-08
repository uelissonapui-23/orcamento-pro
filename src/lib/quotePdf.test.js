import { describe, expect, it } from "vitest";
import {
  buildBusinessSnapshot,
  buildPdfFilename,
  businessDisplayName,
  formatAddress,
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
    expect(snapshot.ignored).toBeUndefined();
  });

  it("prefers trade name", () => {
    expect(businessDisplayName({ trade_name: "Loja", legal_name: "Razão" })).toBe("Loja");
  });

  it("formats address", () => {
    expect(formatAddress({ street: "Rua A", address_number: "10", city: "Goiânia", state: "GO" }))
      .toContain("Rua A, 10");
  });

  it("creates filesystem-safe filename", () => {
    const name = buildPdfFilename(
      { quote_number: 12, client_snapshot_json: { name: "João & Cia" } },
      { trade_name: "Empresa" },
    );
    expect(name).toBe("orcamento-0012-joao-cia.pdf");
  });
});
