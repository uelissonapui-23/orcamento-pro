import { formatBRL } from "./money";
import { quoteNumberLabel } from "./quote";
import { quoteDeliveryDays } from "./quoteDefaults";

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
  // No orçamento, “valor unitário” significa o preço final de UMA unidade
  // vendida daquele item (uma placa, uma faixa, uma peça, um serviço etc.).
  // O campo item.unit_price pode representar a base técnica do motor de preço
  // (ex.: R$/m² ou R$/metro), por isso ele não deve ser exibido como preço
  // unitário comercial no PDF. O valor comercial correto é total / quantidade.
  const quantity = Number(item.quantity || 1);
  const total = Number(item.total_price || 0);

  if (Number.isFinite(total) && Number.isFinite(quantity) && quantity > 0) {
    return Math.round((total / quantity + Number.EPSILON) * 100) / 100;
  }

  const fallback = Number(item.unit_price || 0);
  return Number.isFinite(fallback) ? fallback : 0;
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
  const grossSubtotal = (quote.items || []).reduce((sum, item) => sum + Number(item.gross_total_price ?? item.total_price ?? 0), 0);
  const itemDiscount = Math.max(0, grossSubtotal - Number(quote.subtotal || 0));
  const generalDiscount = Number(quote.discount_total || 0);
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
    deliveryDays: quoteDeliveryDays(quote),
    deliveryTerm: (() => {
      const days = quoteDeliveryDays(quote);
      if (!days) return "A combinar";
      return `${days} ${days === 1 ? "dia" : "dias"} após aprovação`;
    })(),
    subtotal: formatBRL(quote.subtotal),
    grossSubtotal: formatBRL(grossSubtotal),
    itemDiscount: formatBRL(itemDiscount),
    itemDiscountValue: itemDiscount,
    generalDiscount: formatBRL(generalDiscount),
    totalDiscount: formatBRL(itemDiscount + generalDiscount),
    discount: formatBRL(generalDiscount),
    surcharge: formatBRL(quote.surcharge_total),
    total: formatBRL(quote.total),
    primaryColor: business.primary_color || "#111827",
  };
}
