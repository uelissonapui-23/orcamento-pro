import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "AddQuoteItemDialog.jsx"), "utf8");

describe("AddQuoteItemDialog wrapping wizard flow", () => {
  it("hides the add-item dialog while the wrapping wizard is open", () => {
    expect(source).toContain("{!wrappingOpen ? (");
    expect(source).toContain("<WrappingWizardDialog");
  });
});
