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
