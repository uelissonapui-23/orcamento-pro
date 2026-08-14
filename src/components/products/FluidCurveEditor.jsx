import { Plus, Trash2 } from "lucide-react";

const MEASURES = [
  ["square_meter", "Metro quadrado (m²)"], ["linear_meter", "Metro linear (m)"],
  ["unit", "Unidade / peça"], ["quantity", "Quantidade"], ["kg", "Quilograma (kg)"],
  ["liter", "Litro (L)"], ["hour", "Hora"], ["width", "Largura (m)"], ["height", "Altura (m)"],
];

export default function FluidCurveEditor({ value, onChange, errors = {} }) {
  const config = value.configuration_json || {};
  const curve = config.fluid_curve || {};
  const points = Array.isArray(curve.points) && curve.points.length ? curve.points : [{ measure: "0.01", multiplier: "1" }, { measure: "1", multiplier: "1" }];
  const patch = (changes) => onChange("configuration_json", { ...config, fluid_curve: { measure_type: "square_meter", base_cost: "", points, ...curve, ...changes } });
  const updatePoint = (index, field, val) => patch({ points: points.map((p, i) => i === index ? { ...p, [field]: val } : p) });
  return <div className="fluid-curve-editor">
    <div className="mode-info-box accent"><strong>Curva fluida por multiplicador</strong><p>Você informa o custo-base e alguns pontos. Você define medida + multiplicador em cada ponto. O sistema transforma esses pontos em preços-alvo e preenche os intervalos de forma contínua, sem saltos nem picos inesperados.</p></div>
    <div className="product-form-grid">
      <label><span>Unidade de medição</span><select value={curve.measure_type || "square_meter"} onChange={e => patch({ measure_type: e.target.value })}>{MEASURES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label><span>Custo-base da medida</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={curve.base_cost ?? ""} onChange={e => patch({ base_cost: e.target.value })} placeholder="0,00" /></div>{errors.fluid_curve_base ? <small className="field-error">{errors.fluid_curve_base}</small> : <small>É sobre este custo que o multiplicador atua.</small>}</label>
      <label><span>Preço mínimo final</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={value.minimum_price ?? ""} onChange={e => onChange("minimum_price", e.target.value)} placeholder="Opcional" /></div></label>
    </div>
    <div className="curve-points-head"><div><strong>Pontos da curva</strong><span>O preço final é preenchido suavemente entre os pontos.</span></div><button type="button" className="compact-add curve-add" onClick={() => patch({ points: [...points, { measure: "", multiplier: "" }] })}><Plus size={15}/> Adicionar ponto</button></div>
    <div className="curve-points">
      {points.map((p,index) => <div className="curve-point" key={index}><label><span>Medida</span><input inputMode="decimal" value={p.measure ?? ""} onChange={e => updatePoint(index,"measure",e.target.value)} /></label><label><span>Multiplicador</span><div className="suffix-input"><input inputMode="decimal" value={p.multiplier ?? ""} onChange={e => updatePoint(index,"multiplier",e.target.value)} /><span>×</span></div></label><button type="button" className="tier-delete" disabled={points.length <= 2} onClick={() => patch({ points: points.filter((_,i) => i !== index) })} aria-label="Remover ponto"><Trash2 size={16}/></button></div>)}
    </div>
    {errors.fluid_curve ? <small className="field-error">{errors.fluid_curve}</small> : null}
    <small className="curve-help">Em cada ponto: medida × custo-base × multiplicador = preço-alvo. Entre os pontos, o sistema interpola o preço final e calcula o multiplicador equivalente automaticamente. Assim, os valores seguem uma curva contínua.</small>
  </div>;
}
