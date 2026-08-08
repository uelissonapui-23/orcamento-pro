export const CALCULATION_MODES = Object.freeze([
  {
    value: "square_meter",
    label: "Metro quadrado",
    shortLabel: "m²",
    description: "Largura × altura × quantidade.",
  },
  {
    value: "linear_meter",
    label: "Metro linear",
    shortLabel: "m linear",
    description: "Comprimento × quantidade.",
  },
  {
    value: "unit",
    label: "Por unidade",
    shortLabel: "unidade",
    description: "Quantidade × preço unitário.",
  },
  {
    value: "quantity_tier",
    label: "Faixa de quantidade",
    shortLabel: "faixas",
    description: "O preço muda conforme a quantidade escolhida.",
  },
  {
    value: "fixed",
    label: "Valor fixo",
    shortLabel: "fixo",
    description: "Um valor padrão para o item.",
  },
  {
    value: "manual",
    label: "Preço manual",
    shortLabel: "manual",
    description: "O preço será informado no orçamento.",
  },
  {
    value: "wrapping",
    label: "Envelopamento por peças",
    shortLabel: "wizard",
    description: "Abre o wizard de veículo, peças e material.",
  },
]);

export const EMPTY_PRODUCT = Object.freeze({
  name: "",
  category_id: "",
  description: "",
  calculation_mode: "square_meter",
  unit_label: "m²",
  base_price: "",
  minimum_price: "",
  waste_percent: "0",
  active: true,
  configuration_json: {
    fixed_multiplies_quantity: false,
  },
});

export const EMPTY_TIER = Object.freeze({
  min_quantity: 1,
  max_quantity: "",
  price: "",
  price_mode: "total",
});

export function calculationModeMeta(mode) {
  return CALCULATION_MODES.find((item) => item.value === mode) || CALCULATION_MODES[0];
}

export function asMoneyNumber(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function normalizeProduct(record = {}) {
  const mode = CALCULATION_MODES.some((item) => item.value === record.calculation_mode)
    ? record.calculation_mode
    : "square_meter";

  return {
    ...EMPTY_PRODUCT,
    ...record,
    name: String(record.name ?? "").trim(),
    category_id: record.category_id || "",
    description: String(record.description ?? "").trim(),
    calculation_mode: mode,
    unit_label: String(record.unit_label ?? calculationModeMeta(mode).shortLabel).trim(),
    base_price: record.base_price ?? "",
    minimum_price: record.minimum_price ?? "",
    waste_percent: record.waste_percent ?? 0,
    active: record.active !== false,
    configuration_json: {
      ...EMPTY_PRODUCT.configuration_json,
      ...(record.configuration_json || {}),
    },
  };
}

export function normalizeTier(tier = {}) {
  return {
    min_quantity: Math.max(1, Math.trunc(Number(tier.min_quantity || 1))),
    max_quantity:
      tier.max_quantity === "" || tier.max_quantity == null
        ? ""
        : Math.max(1, Math.trunc(Number(tier.max_quantity))),
    price: tier.price ?? "",
    price_mode: tier.price_mode === "unit" ? "unit" : "total",
  };
}

export function validateProduct(record, tiers = []) {
  const product = normalizeProduct(record);
  const errors = {};
  const tierErrors = [];

  if (!product.name) errors.name = "Informe o nome do produto ou serviço.";
  if (!product.category_id) errors.category_id = "Escolha uma categoria.";

  const price = asMoneyNumber(product.base_price);
  const minimum = asMoneyNumber(product.minimum_price);
  const waste = Number(product.waste_percent || 0);

  const requiresBasePrice = ["square_meter", "linear_meter", "unit", "fixed"].includes(product.calculation_mode);

  if (requiresBasePrice && (price == null || price < 0)) {
    errors.base_price = "Informe um preço válido.";
  }

  if (minimum != null && minimum < 0) errors.minimum_price = "O valor mínimo não pode ser negativo.";
  if (!Number.isFinite(waste) || waste < 0 || waste > 500) errors.waste_percent = "Use desperdício entre 0% e 500%.";

  if (product.calculation_mode === "quantity_tier") {
    if (!tiers.length) {
      errors.tiers = "Cadastre pelo menos uma faixa.";
    } else {
      let previousMax = 0;

      tiers.map(normalizeTier).forEach((tier, index) => {
        const current = {};
        const tierPrice = asMoneyNumber(tier.price);

        if (tier.min_quantity < 1) current.min_quantity = "Mínimo inválido.";
        if (tier.max_quantity !== "" && tier.max_quantity < tier.min_quantity) current.max_quantity = "Máximo menor que o mínimo.";
        if (tierPrice == null || tierPrice < 0) current.price = "Preço inválido.";
        if (index > 0 && tier.min_quantity <= previousMax) current.min_quantity = "Faixas sobrepostas.";

        previousMax = tier.max_quantity === "" ? Number.MAX_SAFE_INTEGER : tier.max_quantity;
        tierErrors[index] = current;
      });

      if (tierErrors.some((item) => Object.keys(item || {}).length)) {
        errors.tiers = "Revise as faixas de quantidade.";
      }
    }
  }

  return {
    product,
    tiers: tiers.map(normalizeTier),
    errors,
    tierErrors,
    valid: Object.keys(errors).length === 0,
  };
}

export function formatProductPrice(product) {
  const mode = product.calculation_mode;
  const price = Number(product.base_price);

  if (mode === "manual") return "Preço informado no orçamento";
  if (mode === "wrapping") return "Calculado pelo wizard";
  if (mode === "quantity_tier") return "Preço por faixas";
  if (!Number.isFinite(price)) return "Sem preço";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}
