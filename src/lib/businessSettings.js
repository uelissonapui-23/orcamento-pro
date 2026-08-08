export const DEFAULT_BUSINESS_SETTINGS = Object.freeze({
  legal_name: "",
  trade_name: "",
  document: "",
  phone: "",
  whatsapp: "",
  email: "",
  postal_code: "",
  street: "",
  address_number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  logo_path: "",
  primary_color: "#111827",
  default_quote_validity_days: 7,
  default_delivery_days: 7,
  default_payment_terms: "",
  default_quote_message: "",
  default_quote_notes: "",
  default_quote_terms: "",
});

const TEXT_FIELDS = [
  "legal_name",
  "trade_name",
  "document",
  "phone",
  "whatsapp",
  "email",
  "postal_code",
  "street",
  "address_number",
  "complement",
  "district",
  "city",
  "state",
  "logo_path",
  "default_payment_terms",
  "default_quote_message",
  "default_quote_notes",
  "default_quote_terms",
];

function asBoundedInteger(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

export function normalizeHexColor(value) {
  const candidate = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate.toUpperCase() : "#111827";
}

export function normalizeBusinessSettings(record = {}) {
  const result = { ...DEFAULT_BUSINESS_SETTINGS };

  for (const field of TEXT_FIELDS) {
    result[field] = String(record[field] ?? "").trim();
  }

  result.primary_color = normalizeHexColor(record.primary_color);
  result.default_quote_validity_days = asBoundedInteger(
    record.default_quote_validity_days,
    DEFAULT_BUSINESS_SETTINGS.default_quote_validity_days,
    1,
    365,
  );
  result.default_delivery_days = asBoundedInteger(
    record.default_delivery_days,
    DEFAULT_BUSINESS_SETTINGS.default_delivery_days,
    0,
    365,
  );

  return result;
}

export function validateBusinessSettings(settings) {
  const normalized = normalizeBusinessSettings(settings);
  const errors = {};

  if (!normalized.trade_name && !normalized.legal_name) {
    errors.trade_name = "Informe pelo menos o nome do negócio ou a razão social.";
  }

  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!/^#[0-9A-F]{6}$/.test(normalized.primary_color)) {
    errors.primary_color = "Cor inválida.";
  }

  return { normalized, errors, valid: Object.keys(errors).length === 0 };
}
