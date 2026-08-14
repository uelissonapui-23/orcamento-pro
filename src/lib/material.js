export const MATERIAL_UNITS = Object.freeze([
  "m²",
  "m",
  "un",
  "rolo",
  "folha",
  "litro",
  "kg",
]);

export const EMPTY_MATERIAL = Object.freeze({
  name: "",
  category_id: "",
  unit: "m²",
  roll_width: "",
  cost_value: "",
  sale_value: "",
  wrapping_multiplier: "1",
  wrapping_discount_percent: "0",
  image_path: "",
  use_in_wrapping: false,
  notes: "",
  active: true,
});

function numericOrBlank(value) {
  if (value === "" || value == null) return "";
  const normalized = String(value).replace(",", ".").trim();
  const number = Number(normalized);
  return Number.isFinite(number) ? number : value;
}

export function normalizeMaterial(record = {}) {
  return {
    ...EMPTY_MATERIAL,
    ...record,
    name: String(record.name ?? "").trim(),
    category_id: record.category_id || "",
    unit: String(record.unit ?? "m²").trim() || "m²",
    roll_width: numericOrBlank(record.roll_width),
    cost_value: numericOrBlank(record.cost_value),
    sale_value: numericOrBlank(record.sale_value),
    wrapping_multiplier: numericOrBlank(record.wrapping_multiplier ?? 1),
    wrapping_discount_percent: numericOrBlank(record.wrapping_discount_percent ?? 0),
    image_path: String(record.image_path ?? "").trim(),
    use_in_wrapping: Boolean(record.use_in_wrapping),
    notes: String(record.notes ?? "").trim(),
    active: record.active !== false,
  };
}

export function validateMaterial(record) {
  const material = normalizeMaterial(record);
  const errors = {};

  if (!material.name) errors.name = "Informe o nome do material.";
  if (!material.category_id) errors.category_id = "Escolha uma categoria.";
  if (!material.unit) errors.unit = "Informe a unidade.";

  const rollWidth = material.roll_width === "" ? null : Number(material.roll_width);
  const cost = material.cost_value === "" ? null : Number(material.cost_value);
  const sale = material.sale_value === "" ? null : Number(material.sale_value);
  const wrappingMultiplier = material.wrapping_multiplier === "" ? null : Number(material.wrapping_multiplier);
  const wrappingDiscount = material.wrapping_discount_percent === "" ? 0 : Number(material.wrapping_discount_percent);

  if (rollWidth != null && (!Number.isFinite(rollWidth) || rollWidth <= 0)) {
    errors.roll_width = "A largura deve ser maior que zero.";
  }

  if (material.use_in_wrapping && rollWidth == null) {
    errors.roll_width = "Informe a largura do rolo para usar no envelopamento.";
  }

  if (material.use_in_wrapping && (wrappingMultiplier == null || !Number.isFinite(wrappingMultiplier) || wrappingMultiplier <= 0)) {
    errors.wrapping_multiplier = "Informe um multiplicador maior que zero.";
  }

  if (!Number.isFinite(wrappingDiscount) || wrappingDiscount < 0 || wrappingDiscount >= 100) {
    errors.wrapping_discount_percent = "Use um desconto entre 0% e 99,99%.";
  }

  if (cost != null && (!Number.isFinite(cost) || cost < 0)) {
    errors.cost_value = "O custo não pode ser negativo.";
  }

  if (sale != null && (!Number.isFinite(sale) || sale < 0)) {
    errors.sale_value = "O preço não pode ser negativo.";
  }

  return { material, errors, valid: Object.keys(errors).length === 0 };
}

export function formatMaterialValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}
