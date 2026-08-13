function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysIso(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + Number(days || 0));
  return toIsoDate(next);
}

export function addDaysToIsoDate(value, days) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return "";
  return addDaysIso(new Date(year, month - 1, day), days);
}

export function quoteDeliveryDays(quote = {}) {
  if (!quote.issue_date || !quote.expected_delivery_date) return 0;

  const start = new Date(`${quote.issue_date}T12:00:00`);
  const end = new Date(`${quote.expected_delivery_date}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

export function buildQuoteDefaults(settings, today = new Date()) {
  const validityDays = Number(settings?.default_quote_validity_days ?? 7);
  const deliveryDays = Number(settings?.default_delivery_days ?? 7);

  return {
    issue_date: toIsoDate(today),
    valid_until: addDaysIso(today, validityDays),
    expected_delivery_date: deliveryDays > 0 ? addDaysIso(today, deliveryDays) : "",
    payment_terms_snapshot: settings?.default_payment_terms || "",
    message_snapshot: settings?.default_quote_message || "",
    notes_snapshot: settings?.default_quote_notes || "",
    terms_snapshot: settings?.default_quote_terms || "",
  };
}
