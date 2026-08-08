import { buildClientSnapshot } from "./client";
import { roundMoney } from "./money";

export const QUOTE_STATUSES = Object.freeze({
  draft: "Rascunho",
  awaiting_response: "Aguardando resposta",
  approved: "Aprovado",
  cancelled: "Cancelado",
});

export function createEmptyQuote(defaults = {}) {
  return {
    id: null,
    quote_number: null,
    status: "draft",
    client_id: "",
    client_snapshot_json: {},
    issue_date: defaults.issue_date || "",
    valid_until: defaults.valid_until || "",
    expected_delivery_date: defaults.expected_delivery_date || "",
    payment_terms_snapshot: defaults.payment_terms_snapshot || "",
    message_snapshot: defaults.message_snapshot || "",
    notes_snapshot: defaults.notes_snapshot || "",
    terms_snapshot: defaults.terms_snapshot || "",
    discount_type: "fixed",
    discount_value: 0,
    surcharge_value: 0,
    subtotal: 0,
    discount_total: 0,
    surcharge_total: 0,
    total: 0,
    items: [],
  };
}

export function quoteStatusLabel(status) {
  return QUOTE_STATUSES[status] || status || "Rascunho";
}

export function buildQuoteClientSnapshot(client) {
  return buildClientSnapshot(client);
}

export function normalizeQuoteItem(item = {}, index = 0) {
  return {
    id: item.id || null,
    local_id: item.local_id || item.id || crypto.randomUUID(),
    product_id: item.product_id || null,
    item_type: item.item_type || "product",
    description: String(item.description || "").trim(),
    quantity: Number(item.quantity || 1),
    width: item.width == null ? null : Number(item.width),
    height: item.height == null ? null : Number(item.height),
    area: item.area == null ? null : Number(item.area),
    linear_meters: item.linear_meters == null ? null : Number(item.linear_meters),
    unit_price: roundMoney(item.unit_price || 0),
    total_price: roundMoney(item.total_price || 0),
    calculation_mode: item.calculation_mode || "manual",
    calculation_input_json: item.calculation_input_json || {},
    calculation_snapshot_json: item.calculation_snapshot_json || {},
    notes: String(item.notes || "").trim(),
    sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
  };
}

export function normalizeQuote(record = {}) {
  return {
    ...createEmptyQuote(),
    ...record,
    client_snapshot_json: record.client_snapshot_json || {},
    discount_value: Number(record.discount_value || 0),
    surcharge_value: Number(record.surcharge_value || 0),
    subtotal: roundMoney(record.subtotal || 0),
    discount_total: roundMoney(record.discount_total || 0),
    surcharge_total: roundMoney(record.surcharge_total || 0),
    total: roundMoney(record.total || 0),
    items: (record.items || record.quote_items || []).map(normalizeQuoteItem),
  };
}

export function validateQuote(quote) {
  const errors = {};

  if (!quote.client_id) errors.client_id = "Escolha um cliente.";
  if (!quote.issue_date) errors.issue_date = "Informe a data.";
  if (!quote.valid_until) errors.valid_until = "Informe a validade.";
  if (!quote.items?.length) errors.items = "Adicione pelo menos um item.";
  if (quote.items?.some((item) => !item.description || Number(item.total_price) < 0)) {
    errors.items = "Existe um item inválido no orçamento.";
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}

export function quoteNumberLabel(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `#${String(number).padStart(4, "0")}` : "Novo";
}
