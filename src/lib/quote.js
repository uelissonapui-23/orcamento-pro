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
    business_snapshot_json: {},
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
  const savedDiscount = item.calculation_snapshot_json?.item_discount || {};
  const totalPrice = roundMoney(item.total_price || 0);
  const grossTotalPrice = roundMoney(item.gross_total_price ?? savedDiscount.gross_total_price ?? totalPrice);
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
    total_price: totalPrice,
    gross_total_price: Math.max(grossTotalPrice, totalPrice),
    item_discount_percent: Number(item.item_discount_percent ?? savedDiscount.discount_percent ?? 0),
    item_discount_value: roundMoney(item.item_discount_value ?? savedDiscount.discount_value ?? Math.max(0, grossTotalPrice - totalPrice)),
    calculation_mode: item.calculation_mode || "manual",
    calculation_input_json: item.calculation_input_json || {},
    calculation_snapshot_json: item.calculation_snapshot_json || {},
    notes: String(item.notes || "").trim(),
    sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
  };
}

export function applyQuoteItemDiscount(item, type, rawValue) {
  const normalized = normalizeQuoteItem(item);
  const gross = Math.max(0, Number(normalized.gross_total_price || normalized.total_price || 0));
  const value = Math.max(0, Number(String(rawValue ?? 0).replace(",", ".")) || 0);
  const discountValue = roundMoney(Math.min(gross, type === "percent" ? gross * Math.min(value, 100) / 100 : value));
  const discountPercent = gross > 0 ? Math.round((discountValue / gross) * 10000) / 100 : 0;
  return {
    ...normalized,
    gross_total_price: roundMoney(gross),
    item_discount_percent: discountPercent,
    item_discount_value: discountValue,
    total_price: roundMoney(gross - discountValue),
    calculation_snapshot_json: {
      ...normalized.calculation_snapshot_json,
      item_discount: {
        gross_total_price: roundMoney(gross),
        discount_percent: discountPercent,
        discount_value: discountValue,
      },
    },
  };
}

export function normalizeQuote(record = {}) {
  return {
    ...createEmptyQuote(),
    ...record,
    client_snapshot_json: record.client_snapshot_json || {},
    business_snapshot_json: record.business_snapshot_json || {},
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


export const QUOTE_FILTERS = Object.freeze([
  { value: "all", label: "Todos" },
  { value: "draft", label: "Rascunhos" },
  { value: "awaiting_response", label: "Aguardando resposta" },
  { value: "approved", label: "Aprovados" },
  { value: "cancelled", label: "Cancelados" },
]);

export function quoteCanEdit(status) {
  return status === "draft" || status === "awaiting_response";
}

export function quoteCanCancel(status) {
  return status === "draft" || status === "awaiting_response";
}

export function quoteCanDuplicate(status) {
  return Boolean(status);
}

export function quoteSearchText(quote = {}) {
  return [
    quote.quote_number,
    quote.client_snapshot_json?.name,
    quote.client_snapshot_json?.trade_name,
    quote.client_snapshot_json?.document,
    quote.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
