import { useMemo, useState } from "react";
import { formatBRL } from "../../lib/money";
import { calculateProductPrice } from "../../services/pricingService";

function initialValues(mode, product = {}) {
  if (mode === "square_meter") return { width: "1", height: "1", quantity: "1" };
  if (mode === "linear_meter") return { length: "1", quantity: "1" };
  if (mode === "fluid_curve") { const t=product.configuration_json?.fluid_curve?.measure_type || "square_meter"; if(t==="square_meter") return {width:"0.5",height:"0.5",quantity:"1"}; if(t==="linear_meter") return {length:"1",quantity:"1"}; if(t==="kg") return {weight:"1",quantity:"1"}; if(t==="liter") return {volume:"1",quantity:"1"}; if(t==="hour") return {hours:"1",quantity:"1"}; return {quantity:"1"}; }
  if (mode === "manual") return { manual_price: "100", quantity: "1" };
  return { quantity: "1" };
}

export default function PricingPreview({ product, tiers }) {
  const [inputs, setInputs] = useState(() => initialValues(product.calculation_mode, product));

  const mode = product.calculation_mode;

  const result = useMemo(() => {
    try {
      return {
        data: calculateProductPrice({ product, input: inputs, tiers }),
        error: "",
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Não foi possível calcular.",
      };
    }
  }, [product, inputs, tiers]);

  if (mode === "wrapping") {
    return (
      <div className="pricing-preview-box muted">
        <strong>Teste de cálculo</strong>
        <p>Este modo será calculado pelo wizard de envelopamento na fase própria.</p>
      </div>
    );
  }

  const set = (field, value) => setInputs((current) => ({ ...current, [field]: value }));

  return (
    <div className="pricing-preview-box">
      <div className="pricing-preview-head">
        <div>
          <strong>Teste rápido do preço</strong>
          <span>Serve para conferir a regra antes de salvar.</span>
        </div>
        {result.data?.status === "calculated" ? (
          <b>{formatBRL(result.data.final_total)}</b>
        ) : null}
      </div>

      <div className="pricing-preview-inputs">
        {(mode === "square_meter" || (mode === "fluid_curve" && (product.configuration_json?.fluid_curve?.measure_type || "square_meter") === "square_meter")) ? (
          <>
            <label><span>Largura</span><input inputMode="decimal" value={inputs.width || ""} onChange={(e) => set("width", e.target.value)} /></label>
            <label><span>Altura</span><input inputMode="decimal" value={inputs.height || ""} onChange={(e) => set("height", e.target.value)} /></label>
          </>
        ) : null}

        {(mode === "linear_meter" || (mode === "fluid_curve" && product.configuration_json?.fluid_curve?.measure_type === "linear_meter")) ? (
          <label><span>Comprimento</span><input inputMode="decimal" value={inputs.length || ""} onChange={(e) => set("length", e.target.value)} /></label>
        ) : null}

        {mode === "fluid_curve" && product.configuration_json?.fluid_curve?.measure_type === "kg" ? <label><span>Peso (kg)</span><input inputMode="decimal" value={inputs.weight || ""} onChange={(e) => set("weight", e.target.value)} /></label> : null}
        {mode === "fluid_curve" && product.configuration_json?.fluid_curve?.measure_type === "liter" ? <label><span>Volume (L)</span><input inputMode="decimal" value={inputs.volume || ""} onChange={(e) => set("volume", e.target.value)} /></label> : null}
        {mode === "fluid_curve" && product.configuration_json?.fluid_curve?.measure_type === "hour" ? <label><span>Horas</span><input inputMode="decimal" value={inputs.hours || ""} onChange={(e) => set("hours", e.target.value)} /></label> : null}

        {mode === "manual" ? (
          <label><span>Preço manual</span><input inputMode="decimal" value={inputs.manual_price || ""} onChange={(e) => set("manual_price", e.target.value)} /></label>
        ) : null}

        <label>
          <span>Quantidade</span>
          <input type="number" min="1" inputMode="numeric" value={inputs.quantity || "1"} onChange={(e) => set("quantity", e.target.value)} />
        </label>
      </div>

      {result.error ? <small className="pricing-preview-error">{result.error}</small> : null}

      {result.data?.status === "calculated" ? (
        <div className="pricing-preview-meta">
          {result.data.metrics.total_area_m2 != null ? <span>Área: {result.data.metrics.total_area_m2} m²</span> : null}
          {result.data.metrics.total_length_m != null ? <span>Comprimento: {result.data.metrics.total_length_m} m</span> : null}
          {result.data.metrics.minimum_applied ? <span>Valor mínimo aplicado</span> : null}
          {result.data.metrics.curve_multiplier != null ? <span>Multiplicador: {result.data.metrics.curve_multiplier}×</span> : null}
          {result.data.metrics.curve_measure != null ? <span>Medida-base: {result.data.metrics.curve_measure} {result.data.metrics.curve_measure_label}</span> : null}
          {result.data.metrics.material ? <span>Material: {result.data.metrics.material.name}</span> : null}
          {result.data.metrics.base_value != null ? <span>Base: {formatBRL(result.data.metrics.base_value)}</span> : null}
          {result.data.metrics.profit_percent != null ? <span>Lucro: {result.data.metrics.profit_percent}%</span> : null}
          {result.data.metrics.tier ? (
            <span>
              Faixa: {result.data.metrics.tier.min_quantity}
              {result.data.metrics.tier.max_quantity ? `–${result.data.metrics.tier.max_quantity}` : "+"}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
