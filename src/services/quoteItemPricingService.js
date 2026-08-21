import { calculateProductPrice } from "./pricingService";

export function priceProductForQuote({ product, formValues, tiers = [] }) {
  const result = calculateProductPrice({
    product,
    input: formValues,
    tiers,
  });

  if (result.status !== "calculated") return result;

  return {
    ...result,
    quoteItemDraft: {
      product_id: product.id || null,
      item_type: "product",
      description: product.calculation_mode === "material_resale"
        ? product.default_material?.name || product.name || ""
        : product.name || "",
      quantity: Number(formValues.quantity || 1),
      width: formValues.width ? Number(formValues.width) : null,
      height: formValues.height ? Number(formValues.height) : null,
      area: result.metrics.total_area_m2 ?? null,
      linear_meters: result.metrics.total_length_m ?? null,
      unit_price: result.unit_price,
      total_price: result.final_total,
      calculation_mode: product.calculation_mode,
      calculation_input_json: result.snapshot.inputs,
      calculation_snapshot_json: result.snapshot,
      notes: "",
    },
  };
}
