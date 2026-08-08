export const EMPTY_VEHICLE_MODEL = Object.freeze({
  vehicle_type_id: "",
  brand: "",
  model: "",
  year_from: "",
  year_to: "",
  notes: "",
  image_path: "",
  active: true,
});

export const EMPTY_VEHICLE_PART = Object.freeze({
  name: "",
  area_m2: "",
  difficulty_multiplier: "1",
  waste_percent: "10",
  install_minutes: "",
  image_path: "",
  active: true,
  sort_order: 0,
});

function numericOrBlank(value) {
  if (value === "" || value == null) return "";
  const normalized = String(value).replace(",", ".").trim();
  const number = Number(normalized);
  return Number.isFinite(number) ? number : value;
}

function integerOrBlank(value) {
  if (value === "" || value == null) return "";
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : value;
}

export function normalizeVehicleModel(record = {}) {
  return {
    ...EMPTY_VEHICLE_MODEL,
    ...record,
    vehicle_type_id: record.vehicle_type_id || "",
    brand: String(record.brand ?? "").trim(),
    model: String(record.model ?? "").trim(),
    year_from: integerOrBlank(record.year_from),
    year_to: integerOrBlank(record.year_to),
    notes: String(record.notes ?? "").trim(),
    image_path: String(record.image_path ?? "").trim(),
    active: record.active !== false,
  };
}

export function normalizeVehiclePart(record = {}) {
  return {
    ...EMPTY_VEHICLE_PART,
    ...record,
    name: String(record.name ?? "").trim(),
    area_m2: numericOrBlank(record.area_m2),
    difficulty_multiplier: numericOrBlank(record.difficulty_multiplier ?? 1),
    waste_percent: numericOrBlank(record.waste_percent ?? 10),
    install_minutes: integerOrBlank(record.install_minutes),
    image_path: String(record.image_path ?? "").trim(),
    active: record.active !== false,
    sort_order: Number.isFinite(Number(record.sort_order)) ? Math.trunc(Number(record.sort_order)) : 0,
  };
}

export function validateVehicleModel(record, parts = []) {
  const model = normalizeVehicleModel(record);
  const errors = {};
  const partErrors = [];

  if (!model.vehicle_type_id) errors.vehicle_type_id = "Escolha o tipo de veículo.";
  if (!model.brand) errors.brand = "Informe a marca.";
  if (!model.model) errors.model = "Informe o modelo.";

  if (model.year_from !== "" && (model.year_from < 1900 || model.year_from > 2200)) {
    errors.year_from = "Ano inicial inválido.";
  }

  if (model.year_to !== "" && (model.year_to < 1900 || model.year_to > 2200)) {
    errors.year_to = "Ano final inválido.";
  }

  if (model.year_from !== "" && model.year_to !== "" && model.year_to < model.year_from) {
    errors.year_to = "Ano final não pode ser menor que o inicial.";
  }

  parts.map(normalizeVehiclePart).forEach((part, index) => {
    const current = {};

    if (!part.name) current.name = "Informe o nome da peça.";

    const area = Number(part.area_m2);
    const difficulty = Number(part.difficulty_multiplier);
    const waste = Number(part.waste_percent);
    const time = part.install_minutes === "" ? null : Number(part.install_minutes);

    if (!Number.isFinite(area) || area <= 0) current.area_m2 = "Área deve ser maior que zero.";
    if (!Number.isFinite(difficulty) || difficulty <= 0 || difficulty > 10) current.difficulty_multiplier = "Use dificuldade entre 0,1 e 10.";
    if (!Number.isFinite(waste) || waste < 0 || waste > 500) current.waste_percent = "Use desperdício entre 0% e 500%.";
    if (time != null && (!Number.isInteger(time) || time < 0)) current.install_minutes = "Tempo inválido.";

    partErrors[index] = current;
  });

  if (partErrors.some((item) => Object.keys(item || {}).length)) {
    errors.parts = "Revise as peças.";
  }

  return {
    model,
    parts: parts.map(normalizeVehiclePart),
    errors,
    partErrors,
    valid: Object.keys(errors).length === 0,
  };
}

export function vehicleDisplayName(vehicle) {
  const years =
    vehicle.year_from && vehicle.year_to
      ? `${vehicle.year_from}–${vehicle.year_to}`
      : vehicle.year_from
        ? `${vehicle.year_from}+`
        : "";

  return [vehicle.brand, vehicle.model, years].filter(Boolean).join(" ");
}

export function totalVehicleArea(parts = []) {
  return Math.round(
    parts
      .filter((part) => part.active !== false)
      .reduce((sum, part) => sum + Number(part.area_m2 || 0), 0) * 1000,
  ) / 1000;
}

export function totalVehicleInstallMinutes(parts = []) {
  return parts
    .filter((part) => part.active !== false)
    .reduce((sum, part) => sum + Number(part.install_minutes || 0), 0);
}
