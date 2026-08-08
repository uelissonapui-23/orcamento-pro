import { roundMoney, toNumber } from "../lib/money";

export const WRAPPING_ENGINE_VERSION = 1;

function positive(value, label) {
  const number = toNumber(value, NaN);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} deve ser maior que zero.`);
  return number;
}

function nonNegative(value, label, fallback = 0) {
  const number = toNumber(value, fallback);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} não pode ser negativo.`);
  return number;
}

export function calculateWrappingPrice({ product, vehicle, material, selectedParts = [], adjustments = {} }) {
  if (!vehicle?.id) throw new Error("Escolha o veículo.");
  if (!material?.id) throw new Error("Escolha o material.");
  if (!selectedParts.length) throw new Error("Selecione pelo menos uma peça.");

  const materialPrice = positive(adjustments.material_price_m2 ?? material.sale_value, "Preço do material por m²");
  const extraPercent = nonNegative(adjustments.extra_percent, "Adicional percentual");
  const extraFixed = nonNegative(adjustments.extra_fixed, "Adicional fixo");
  const discount = nonNegative(adjustments.discount, "Desconto");

  const parts = selectedParts.map((part) => {
    const area = positive(part.area_m2, `Área de ${part.name}`);
    const waste = nonNegative(part.waste_percent, `Desperdício de ${part.name}`);
    const difficulty = positive(part.difficulty_multiplier || 1, `Dificuldade de ${part.name}`);
    const chargedArea = area * (1 + waste / 100);
    const subtotal = chargedArea * materialPrice * difficulty;
    return {
      id: part.id || null,
      name: part.name,
      area_m2: roundMoney(area),
      waste_percent: waste,
      charged_area_m2: roundMoney(chargedArea),
      difficulty_multiplier: difficulty,
      install_minutes: Number(part.install_minutes || 0),
      subtotal: roundMoney(subtotal),
    };
  });

  const area = roundMoney(parts.reduce((sum, part) => sum + part.area_m2, 0));
  const chargedArea = roundMoney(parts.reduce((sum, part) => sum + part.charged_area_m2, 0));
  const installMinutes = parts.reduce((sum, part) => sum + part.install_minutes, 0);
  const baseTotal = roundMoney(parts.reduce((sum, part) => sum + part.subtotal, 0));
  const percentValue = roundMoney(baseTotal * extraPercent / 100);
  const beforeDiscount = roundMoney(baseTotal + percentValue + extraFixed);
  const finalTotal = roundMoney(Math.max(0, beforeDiscount - Math.min(discount, beforeDiscount)));

  const snapshot = {
    engine_version: WRAPPING_ENGINE_VERSION,
    calculation_mode: "wrapping",
    product: { id: product?.id || null, name: product?.name || "Envelopamento" },
    vehicle: {
      id: vehicle.id,
      type: vehicle.type?.name || "",
      brand: vehicle.brand,
      model: vehicle.model,
      year_from: vehicle.year_from || null,
      year_to: vehicle.year_to || null,
    },
    material: {
      id: material.id,
      name: material.name,
      unit: material.unit,
      roll_width: material.roll_width || null,
      price_m2: roundMoney(materialPrice),
    },
    parts,
    adjustments: {
      extra_percent: extraPercent,
      extra_fixed: roundMoney(extraFixed),
      discount: roundMoney(discount),
    },
    result: { area_m2: area, charged_area_m2: chargedArea, install_minutes: installMinutes, base_total: baseTotal, extra_percent_value: percentValue, final_total: finalTotal },
  };

  return {
    status: "calculated",
    calculation_mode: "wrapping",
    final_total: finalTotal,
    unit_price: finalTotal,
    metrics: snapshot.result,
    snapshot,
    quoteItemDraft: {
      product_id: product?.id || null,
      item_type: "product",
      description: `${product?.name || "Envelopamento"} — ${vehicle.brand} ${vehicle.model}`,
      quantity: 1,
      width: null,
      height: null,
      area,
      linear_meters: null,
      unit_price: finalTotal,
      total_price: finalTotal,
      calculation_mode: "wrapping",
      calculation_input_json: { vehicle_id: vehicle.id, material_id: material.id, part_ids: parts.map((part) => part.id).filter(Boolean), adjustments: snapshot.adjustments },
      calculation_snapshot_json: snapshot,
      notes: parts.map((part) => part.name).join(", "),
    },
  };
}
