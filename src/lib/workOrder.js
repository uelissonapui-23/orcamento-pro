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
