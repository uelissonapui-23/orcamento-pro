export const EMPTY_CLIENT = Object.freeze({
  name: "",
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
  notes: "",
  active: true,
});

export function onlyDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeClient(record = {}) {
  return {
    ...EMPTY_CLIENT,
    ...record,
    name: String(record.name ?? "").trim(),
    trade_name: String(record.trade_name ?? "").trim(),
    document: String(record.document ?? "").trim(),
    phone: String(record.phone ?? "").trim(),
    whatsapp: String(record.whatsapp ?? "").trim(),
    email: normalizeEmail(record.email),
    postal_code: String(record.postal_code ?? "").trim(),
    street: String(record.street ?? "").trim(),
    address_number: String(record.address_number ?? "").trim(),
    complement: String(record.complement ?? "").trim(),
    district: String(record.district ?? "").trim(),
    city: String(record.city ?? "").trim(),
    state: String(record.state ?? "").trim().toUpperCase().slice(0, 2),
    notes: String(record.notes ?? "").trim(),
    active: record.active !== false,
  };
}

export function validateClient(record, { quick = false } = {}) {
  const client = normalizeClient(record);
  const errors = {};

  if (!client.name) errors.name = "Informe o nome do cliente.";

  if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (quick && !client.whatsapp && !client.phone) {
    errors.whatsapp = "Informe WhatsApp ou telefone.";
  }

  return { client, errors, valid: Object.keys(errors).length === 0 };
}

export function buildClientSnapshot(record) {
  const client = normalizeClient(record);

  return {
    id: client.id || null,
    name: client.name,
    trade_name: client.trade_name,
    document: client.document,
    phone: client.phone,
    whatsapp: client.whatsapp,
    email: client.email,
    postal_code: client.postal_code,
    street: client.street,
    address_number: client.address_number,
    complement: client.complement,
    district: client.district,
    city: client.city,
    state: client.state,
  };
}

export function formatClientLocation(client) {
  return [client.city, client.state].filter(Boolean).join(" - ");
}
