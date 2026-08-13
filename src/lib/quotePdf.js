import { formatBRL } from "./money";
import { quoteNumberLabel } from "./quote";

export function buildBusinessSnapshot(settings = {}) {
  return {
    legal_name: settings.legal_name || "",
    trade_name: settings.trade_name || "",
    document: settings.document || "",
    phone: settings.phone || "",
    whatsapp: settings.whatsapp || "",
    email: settings.email || "",
    postal_code: settings.postal_code || "",
    street: settings.street || "",
    address_number: settings.address_number || "",
    complement: settings.complement || "",
    district: settings.district || "",
    city: settings.city || "",
    state: settings.state || "",
    logo_path: settings.logo_path || "",
    pdf_logo_path: settings.pdf_logo_path || settings.logo_path || "",
    primary_color: settings.primary_color || "#111827",
  };
}

export function quoteItemUnitPrice(item = {}) {
  if (item.unit_price !== null && item.unit_price !== undefined && item.unit_price !== "") {
    const explicit = Number(item.unit_price);
    if (Number.isFinite(explicit)) return explicit;
  }

  const quantity = Number(item.quantity || 1);
  const total = Number(item.total_price || 0);
  return Number.isFinite(total) && Number.isFinite(quantity) && quantity > 0
    ? total / quantity
    : 0;
}

export function businessDisplayName(business = {}) {
  return business.trade_name || business.legal_name || "Orçamento";
}

export function formatAddress(record = {}) {
  const streetLine = [
    record.street,
    record.address_number,
    record.complement,
  ].filter(Boolean).join(", ");

  const cityLine = [
    record.district,
    [record.city, record.state].filter(Boolean).join(" - "),
    record.postal_code,
  ].filter(Boolean).join(" · ");

  return [streetLine, cityLine].filter(Boolean).join("\n");
}

export function formatContact(record = {}) {
  return [
    record.phone || record.whatsapp,
    record.email,
  ].filter(Boolean).join(" · ");
}

export function formatDocumentLine(record = {}) {
  return record.document ? `CPF/CNPJ: ${record.document}` : "";
}

export function formatQuoteDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

export function buildPdfFilename(quote, business = {}) {
  const number = quoteNumberLabel(quote.quote_number).replace("#", "");
  const client = String(quote.client_snapshot_json?.name || "cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const company = businessDisplayName(business)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `orcamento-${number}-${client || company || "documento"}.pdf`;
}

export function quotePdfViewModel(quote, business = {}) {
  return {
    quoteNumber: quoteNumberLabel(quote.quote_number),
    companyName: businessDisplayName(business),
    companyLegalName:
      business.legal_name && business.legal_name !== businessDisplayName(business)
        ? business.legal_name
        : "",
    companyDocument: formatDocumentLine(business),
    companyAddress: formatAddress(business),
    companyContact: formatContact(business),
    clientName: quote.client_snapshot_json?.name || "Cliente",
    clientTradeName: quote.client_snapshot_json?.trade_name || "",
    clientDocument: formatDocumentLine(quote.client_snapshot_json),
    clientAddress: formatAddress(quote.client_snapshot_json),
    clientContact: formatContact(quote.client_snapshot_json),
    issueDate: formatQuoteDate(quote.issue_date),
    validUntil: formatQuoteDate(quote.valid_until),
    expectedDeliveryDate: formatQuoteDate(quote.expected_delivery_date),
    subtotal: formatBRL(quote.subtotal),
    discount: formatBRL(quote.discount_total),
    surcharge: formatBRL(quote.surcharge_total),
    total: formatBRL(quote.total),
    primaryColor: business.primary_color || "#111827",
  };
}
