import { roundMoney, toNumber } from "../lib/money";

export const PRICING_ENGINE_VERSION = 1;

export class PricingError extends Error {
  constructor(code, message, field = "") {
    super(message);
    this.name = "PricingError";
    this.code = code;
    this.field = field;
  }
}

function positive(value, field, label) {
  const number = toNumber(value, NaN);
  if (!Number.isFinite(number) || number <= 0) {
    throw new PricingError("INVALID_INPUT", `${label} deve ser maior que zero.`, field);
  }
  return number;
}

function nonNegative(value, field, label, fallback = 0) {
  const number = toNumber(value, fallback);
  if (!Number.isFinite(number) || number < 0) {
    throw new PricingError("INVALID_INPUT", `${label} não pode ser negativo.`, field);
  }
  return number;
}

function integerQuantity(value) {
  const number = positive(value, "quantity", "Quantidade");
  if (!Number.isInteger(number)) {
    throw new PricingError("INVALID_INPUT", "Quantidade deve ser um número inteiro.", "quantity");
  }
  return number;
}

function baseSnapshot(product, input, result) {
  return {
    engine_version: PRICING_ENGINE_VERSION,
    calculation_mode: product.calculation_mode,
    product_id: product.id || null,
    product_name: product.name || "",
    unit_label: product.unit_label || "",
    inputs: input,
    pricing: {
      base_price: product.base_price == null || product.base_price === "" ? null : roundMoney(product.base_price),
      minimum_price: product.minimum_price == null || product.minimum_price === "" ? null : roundMoney(product.minimum_price),
      waste_percent: toNumber(product.waste_percent, 0),
    },
    result,
  };
}

function applyMinimum(value, minimumPrice) {
  const minimum = nonNegative(minimumPrice, "minimum_price", "Valor mínimo", 0);
  const raw = roundMoney(value);
  return {
    raw_total: raw,
    minimum_applied: minimum > 0 && raw < minimum,
    final_total: roundMoney(Math.max(raw, minimum)),
  };
}

function calculateSquareMeter(product, input) {
  const width = positive(input.width, "width", "Largura");
  const height = positive(input.height, "height", "Altura");
  const quantity = integerQuantity(input.quantity ?? 1);
  const basePrice = nonNegative(product.base_price, "base_price", "Preço por m²");
  const wastePercent = nonNegative(
    input.waste_percent ?? product.waste_percent,
    "waste_percent",
    "Desperdício",
  );

  const unitArea = width * height;
  const totalArea = unitArea * quantity;
  const chargedArea = totalArea * (1 + wastePercent / 100);
  const minimum = applyMinimum(chargedArea * basePrice, product.minimum_price);

  return {
    input: { width, height, quantity, waste_percent: wastePercent },
    result: {
      unit_area_m2: roundMoney(unitArea),
      total_area_m2: roundMoney(totalArea),
      charged_area_m2: roundMoney(chargedArea),
      unit_price: roundMoney(basePrice),
      ...minimum,
    },
  };
}

function calculateLinearMeter(product, input) {
  const length = positive(input.length, "length", "Comprimento");
  const quantity = integerQuantity(input.quantity ?? 1);
  const basePrice = nonNegative(product.base_price, "base_price", "Preço por metro");
  const totalLength = length * quantity;
  const minimum = applyMinimum(totalLength * basePrice, product.minimum_price);

  return {
    input: { length, quantity },
    result: {
      total_length_m: roundMoney(totalLength),
      unit_price: roundMoney(basePrice),
      ...minimum,
    },
  };
}

function calculateUnit(product, input) {
  const quantity = integerQuantity(input.quantity ?? 1);
  const basePrice = nonNegative(product.base_price, "base_price", "Preço por unidade");
  const minimum = applyMinimum(quantity * basePrice, product.minimum_price);

  return {
    input: { quantity },
    result: {
      quantity,
      unit_price: roundMoney(basePrice),
      ...minimum,
    },
  };
}

function findTier(tiers, quantity) {
  const ordered = [...(tiers || [])]
    .map((tier) => ({
      ...tier,
      min_quantity: Number(tier.min_quantity),
      max_quantity:
        tier.max_quantity === "" || tier.max_quantity == null
          ? null
          : Number(tier.max_quantity),
      price: toNumber(tier.price, NaN),
      price_mode: tier.price_mode === "unit" ? "unit" : "total",
    }))
    .sort((a, b) => a.min_quantity - b.min_quantity);

  return ordered.find(
    (tier) =>
      quantity >= tier.min_quantity &&
      (tier.max_quantity == null || quantity <= tier.max_quantity),
  );
}

function calculateQuantityTier(product, input, tiers) {
  const quantity = integerQuantity(input.quantity);
  const tier = findTier(tiers, quantity);

  if (!tier) {
    throw new PricingError(
      "TIER_NOT_FOUND",
      "Não existe uma faixa de preço para esta quantidade.",
      "quantity",
    );
  }

  if (!Number.isFinite(tier.price) || tier.price < 0) {
    throw new PricingError("INVALID_TIER", "A faixa selecionada possui preço inválido.");
  }

  const rawTotal = tier.price_mode === "unit" ? quantity * tier.price : tier.price;

  return {
    input: { quantity },
    result: {
      quantity,
      tier: {
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity,
        price: roundMoney(tier.price),
        price_mode: tier.price_mode,
      },
      raw_total: roundMoney(rawTotal),
      minimum_applied: false,
      final_total: roundMoney(rawTotal),
      unit_price:
        tier.price_mode === "unit"
          ? roundMoney(tier.price)
          : roundMoney(rawTotal / quantity),
    },
  };
}


function fluidMeasure(curve, input) {
  const type = curve.measure_type || "square_meter";
  const quantity = integerQuantity(input.quantity ?? 1);
  if (type === "square_meter") return { value: positive(input.width, "width", "Largura") * positive(input.height, "height", "Altura"), quantity, label: "m²" };
  if (type === "linear_meter") return { value: positive(input.length, "length", "Comprimento"), quantity, label: "m" };
  if (type === "width") return { value: positive(input.width, "width", "Largura"), quantity, label: "m" };
  if (type === "height") return { value: positive(input.height, "height", "Altura"), quantity, label: "m" };
  if (type === "kg") return { value: positive(input.weight, "weight", "Peso"), quantity, label: "kg" };
  if (type === "liter") return { value: positive(input.volume, "volume", "Volume"), quantity, label: "L" };
  if (type === "hour") return { value: positive(input.hours, "hours", "Horas"), quantity, label: "h" };
  return { value: quantity, quantity: 1, label: type === "unit" ? "un" : "qtd" };
}
function normalizeCurvePoints(points, baseCost) {
  return [...(points || [])]
    .map((point) => {
      const measure = toNumber(point.measure, NaN);
      const multiplier = toNumber(point.multiplier, NaN);
      return {
        measure,
        multiplier,
        target_price: measure * baseCost * multiplier,
      };
    })
    .filter(
      (point) =>
        Number.isFinite(point.measure) &&
        point.measure > 0 &&
        Number.isFinite(point.multiplier) &&
        point.multiplier > 0,
    )
    .sort((a, b) => a.measure - b.measure);
}

function interpolateFluidCurve(points, measure, baseCost) {
  const ordered = normalizeCurvePoints(points, baseCost);
  if (ordered.length < 2) {
    throw new PricingError(
      "INVALID_CURVE",
      "Cadastre pelo menos dois pontos válidos na curva fluida.",
    );
  }

  if (measure <= ordered[0].measure) {
    const point = ordered[0];
    const price = measure * baseCost * point.multiplier;
    return { price, multiplier: point.multiplier, from: point, to: point };
  }

  if (measure >= ordered[ordered.length - 1].measure) {
    const point = ordered[ordered.length - 1];
    const price = measure * baseCost * point.multiplier;
    return { price, multiplier: point.multiplier, from: point, to: point };
  }

  const to = ordered.find((point) => point.measure >= measure);
  const from = ordered[ordered.indexOf(to) - 1];
  const ratio = (measure - from.measure) / (to.measure - from.measure);

  // Os multiplicadores definem o preço desejado em cada ponto. Entre dois
  // pontos, interpolamos o PREÇO FINAL, e só então derivamos o multiplicador
  // equivalente. Isso garante uma curva contínua e sem picos acima dos pontos.
  const price = from.target_price + (to.target_price - from.target_price) * ratio;
  const multiplier = price / (measure * baseCost);

  return { price, multiplier, from, to };
}

function calculateFluidCurve(product, input) {
  const curve = product.configuration_json?.fluid_curve || {};
  const baseCost = positive(curve.base_cost, "base_cost", "Custo-base");
  const measured = fluidMeasure(curve, input);
  const interpolation = interpolateFluidCurve(curve.points || [], measured.value, baseCost);
  const unitTotal = interpolation.price;
  const rawTotal = unitTotal * measured.quantity;
  const minimum = applyMinimum(rawTotal, product.minimum_price);

  return {
    input: { ...input, quantity: measured.quantity },
    result: {
      quantity: measured.quantity,
      curve_measure: roundMoney(measured.value),
      curve_measure_label: measured.label,
      curve_multiplier: Math.round(interpolation.multiplier * 10000) / 10000,
      curve_base_cost: roundMoney(baseCost),
      curve_from: interpolation.from,
      curve_to: interpolation.to,
      curve_unit_total: roundMoney(unitTotal),
      unit_price: roundMoney(minimum.final_total / measured.quantity),
      ...minimum,
    },
  };
}

function calculateFixed(product, input) {
  const quantity = integerQuantity(input.quantity ?? 1);
  const basePrice = nonNegative(product.base_price, "base_price", "Valor fixo");
  const multiplies = Boolean(product.configuration_json?.fixed_multiplies_quantity);
  const raw = multiplies ? basePrice * quantity : basePrice;

  return {
    input: { quantity },
    result: {
      quantity,
      unit_price: roundMoney(basePrice),
      fixed_multiplies_quantity: multiplies,
      raw_total: roundMoney(raw),
      minimum_applied: false,
      final_total: roundMoney(raw),
    },
  };
}

function calculateManual(product, input) {
  const quantity = integerQuantity(input.quantity ?? 1);
  const manualPrice = nonNegative(input.manual_price, "manual_price", "Preço manual");

  return {
    input: { quantity, manual_price: roundMoney(manualPrice) },
    result: {
      quantity,
      unit_price: roundMoney(manualPrice / quantity),
      raw_total: roundMoney(manualPrice),
      minimum_applied: false,
      final_total: roundMoney(manualPrice),
    },
  };
}

export function calculateProductPrice({ product, input = {}, tiers = [] }) {
  if (!product?.calculation_mode) {
    throw new PricingError("INVALID_PRODUCT", "Produto sem forma de cálculo.");
  }

  let calculated;

  switch (product.calculation_mode) {
    case "square_meter":
      calculated = calculateSquareMeter(product, input);
      break;
    case "linear_meter":
      calculated = calculateLinearMeter(product, input);
      break;
    case "unit":
      calculated = calculateUnit(product, input);
      break;
    case "quantity_tier":
      calculated = calculateQuantityTier(product, input, tiers);
      break;
    case "fluid_curve":
      calculated = calculateFluidCurve(product, input);
      break;
    case "fixed":
      calculated = calculateFixed(product, input);
      break;
    case "manual":
      calculated = calculateManual(product, input);
      break;
    case "wrapping":
      return {
        status: "requires_wizard",
        calculation_mode: "wrapping",
        final_total: null,
        snapshot: {
          engine_version: PRICING_ENGINE_VERSION,
          calculation_mode: "wrapping",
          product_id: product.id || null,
          product_name: product.name || "",
          delegated_to: "wrappingService",
        },
      };
    default:
      throw new PricingError("UNSUPPORTED_MODE", "Forma de cálculo não suportada.");
  }

  const snapshot = baseSnapshot(product, calculated.input, calculated.result);

  if (product.calculation_mode === "quantity_tier") {
    snapshot.pricing.tier = calculated.result.tier;
  }

  return {
    status: "calculated",
    calculation_mode: product.calculation_mode,
    final_total: calculated.result.final_total,
    unit_price: calculated.result.unit_price,
    metrics: calculated.result,
    snapshot,
  };
}

export function calculateQuoteTotals({
  items = [],
  discountType = "fixed",
  discountValue = 0,
  surchargeValue = 0,
}) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + nonNegative(item.total_price ?? item.final_total, "item", "Valor do item"), 0),
  );

  const surcharge = nonNegative(surchargeValue, "surcharge_value", "Adicional");
  const discountInput = nonNegative(discountValue, "discount_value", "Desconto");

  let discount = discountInput;

  if (discountType === "percent") {
    if (discountInput > 100) {
      throw new PricingError("INVALID_DISCOUNT", "Desconto percentual não pode ser maior que 100%.", "discount_value");
    }
    discount = subtotal * (discountInput / 100);
  } else if (discountType !== "fixed") {
    throw new PricingError("INVALID_DISCOUNT_TYPE", "Tipo de desconto inválido.", "discount_type");
  }

  discount = roundMoney(Math.min(discount, subtotal + surcharge));
  const total = roundMoney(Math.max(0, subtotal + surcharge - discount));

  return {
    subtotal,
    discount_type: discountType,
    discount_input: roundMoney(discountInput),
    discount_total: discount,
    surcharge_total: roundMoney(surcharge),
    total,
  };
}
