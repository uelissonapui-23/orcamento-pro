import { describe, expect, it } from "vitest";
import { buildClientSnapshot, normalizeClient, onlyDigits, validateClient } from "./client";

describe("client domain", () => {
  it("normalizes core data", () => {
    const client = normalizeClient({
      name: "  João  ",
      email: " JOAO@EXAMPLE.COM ",
      state: "sp",
    });

    expect(client.name).toBe("João");
    expect(client.email).toBe("joao@example.com");
    expect(client.state).toBe("SP");
  });

  it("validates quick clients with contact", () => {
    expect(validateClient({ name: "João" }, { quick: true }).valid).toBe(false);
    expect(validateClient({ name: "João", whatsapp: "(11) 99999-9999" }, { quick: true }).valid).toBe(true);
  });

  it("creates immutable historical shape", () => {
    const snapshot = buildClientSnapshot({
      id: "abc",
      name: "Cliente",
      whatsapp: "11999999999",
      notes: "não entra",
    });

    expect(snapshot).toEqual(expect.objectContaining({ id: "abc", name: "Cliente" }));
    expect(snapshot.notes).toBeUndefined();
  });

  it("normalizes digits for duplicate checks", () => {
    expect(onlyDigits("(11) 99999-8888")).toBe("11999998888");
  });
});
