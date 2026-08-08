import { describe, expect, it } from "vitest";
import { normalizeWorkOrder, workOrderStatusLabel, workOrderTitle, workOrderUrgency } from "./workOrder";

describe("work order domain", () => {
  it("normalizes snapshots", () => {
    const order = normalizeWorkOrder({ status: "pending" });
    expect(order.items_snapshot_json).toEqual([]);
    expect(order.client_snapshot_json).toEqual({});
  });

  it("formats title", () => {
    expect(workOrderTitle({
      quote_number: 12,
      client_snapshot_json: { name: "Cliente X" },
    })).toBe("#0012 · Cliente X");
  });

  it("labels status", () => {
    expect(workOrderStatusLabel("pending")).toBe("A fazer");
  });
  it("detects overdue and soon orders", () => {
    const today = new Date(2026, 7, 8, 12, 0, 0);
    expect(workOrderUrgency({ due_date: "2026-08-07", status: "pending" }, today).level).toBe("overdue");
    expect(workOrderUrgency({ due_date: "2026-08-09", status: "pending" }, today).level).toBe("soon");
  });
});
