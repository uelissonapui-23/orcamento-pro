import { describe, expect, it } from "vitest";
import { dashboardPriorityLabel, dashboardPriorityTone } from "./dashboard";

describe("dashboard helpers", () => {
  it("prioritizes overdue", () => {
    expect(dashboardPriorityLabel({ overdue: 2, dueSoon: 4, awaiting: 3 }))
      .toContain("2 serviço");
    expect(dashboardPriorityTone({ overdue: 1 })).toBe("danger");
  });

  it("falls back to awaiting", () => {
    expect(dashboardPriorityLabel({ overdue: 0, dueSoon: 0, awaiting: 3 }))
      .toContain("aguardando resposta");
  });
});
