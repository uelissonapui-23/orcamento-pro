export const WORK_ORDER_STATUSES = Object.freeze({
  pending: "A fazer",
  in_progress: "Em produção",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
});

export function workOrderStatusLabel(status) {
  return WORK_ORDER_STATUSES[status] || status || "A fazer";
}

export function normalizeWorkOrder(record = {}) {
  return {
    ...record,
    quote_snapshot_json: record.quote_snapshot_json || {},
    items_snapshot_json: Array.isArray(record.items_snapshot_json)
      ? record.items_snapshot_json
      : [],
    client_snapshot_json: record.client_snapshot_json || {},
    status: record.status || "pending",
  };
}

export function workOrderTitle(order = {}) {
  const quoteNumber = order.quote_number
    ? `#${String(order.quote_number).padStart(4, "0")}`
    : "";
  const client = order.client_snapshot_json?.name || "Cliente";
  return [quoteNumber, client].filter(Boolean).join(" · ");
}


export function workOrderUrgency(order, today = new Date()) {
  if (!order?.due_date || order.status === "delivered" || order.status === "cancelled") {
    return { level: "none", days: null, label: "" };
  }

  const due = new Date(`${order.due_date}T12:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  const diff = Math.ceil((due - start) / 86400000);

  if (diff < 0) return { level: "overdue", days: diff, label: `${Math.abs(diff)} dia(s) atrasado` };
  if (diff === 0) return { level: "today", days: 0, label: "Vence hoje" };
  if (diff <= 2) return { level: "soon", days: diff, label: `Vence em ${diff} dia(s)` };
  return { level: "normal", days: diff, label: `Vence em ${diff} dia(s)` };
}

export function workOrderCanStart(status) {
  return status === "pending";
}

export function workOrderCanReady(status) {
  return status === "in_progress";
}

export function workOrderCanDeliver(status) {
  return status === "ready";
}
