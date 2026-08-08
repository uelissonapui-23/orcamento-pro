export function toNumber(value, fallback = 0) {
  if (value === "" || value == null) return fallback;
  const normalized = typeof value === "string" ? value.replace(",", ".").trim() : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : fallback;
}

export function roundMoney(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

export function moneyToCents(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100);
}

export function centsToMoney(cents) {
  return roundMoney(Number(cents || 0) / 100);
}

export function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(roundMoney(value));
}
