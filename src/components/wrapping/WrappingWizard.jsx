import { ArrowLeft, ArrowRight, Check, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createMaterialImageUrl, listMaterials } from "../../services/materialService";
import { listProducts } from "../../services/productService";
import { listVehicleModels, listVehicleTypes } from "../../services/vehicleService";
import { calculateWrappingPrice } from "../../services/wrappingService";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

export default function WrappingWizard({ workspaceId, product: suppliedProduct = null, onCancel, onComplete }) {
  const [step, setStep] = useState(0);
  const [types, setTypes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [materialImages, setMaterialImages] = useState({});
  const [products, setProducts] = useState([]);
  const [typeId, setTypeId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [productId, setProductId] = useState(suppliedProduct?.id || "");
  const [partIds, setPartIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    Promise.all([
      listVehicleTypes(workspaceId),
      listVehicleModels(workspaceId),
      listMaterials(workspaceId, { wrapping: "yes" }),
      suppliedProduct ? Promise.resolve([]) : listProducts(workspaceId, { mode: "wrapping" }),
    ]).then(([nextTypes, nextVehicles, nextMaterials, nextProducts]) => {
      setTypes(nextTypes);
      setVehicles(nextVehicles);
      setMaterials(nextMaterials);
      setProducts(nextProducts);
      if (nextTypes.length === 1) setTypeId(nextTypes[0].id);

      if (nextMaterials.length === 1) setMaterialId(nextMaterials[0].id);
      Promise.all(nextMaterials.map(async (item) => {
        if (!item.image_path) return [item.id, ""];
        try { return [item.id, await createMaterialImageUrl(item.image_path)]; }
        catch { return [item.id, ""]; }
      })).then((entries) => setMaterialImages(Object.fromEntries(entries)));

      if (!suppliedProduct && nextProducts.length === 1) setProductId(nextProducts[0].id);
    }).catch((e) => setError(e.message || "Não foi possível preparar o wizard.")).finally(() => setLoading(false));
  }, [workspaceId, suppliedProduct]);

  const product = suppliedProduct || products.find((item) => item.id === productId) || null;
  const steps = useMemo(() => [
    { key: "type", label: "Tipo" },
    { key: "model", label: "Modelo" },
    { key: "parts", label: "Peças" },
    { key: "material", label: "Material" },
    { key: "summary", label: "Resumo" },
  ], []);

  useEffect(() => {
    if (step > steps.length - 1) setStep(Math.max(0, steps.length - 1));
  }, [steps.length, step]);

  const currentStep = steps[step]?.key || "summary";
  const filteredVehicles = useMemo(() => vehicles.filter((item) => !typeId || item.vehicle_type_id === typeId), [vehicles, typeId]);
  const vehicle = vehicles.find((item) => item.id === vehicleId) || null;
  const material = materials.find((item) => item.id === materialId) || null;
  const selectedParts = (vehicle?.parts || []).filter((part) => part.active !== false && partIds.includes(part.id));
  const materialOptions = useMemo(() => materials.map((item) => {
    if (!vehicle || !selectedParts.length || !product) return { material: item, result: null };
    try { return { material: item, result: calculateWrappingPrice({ product, vehicle, material: item, selectedParts }) }; }
    catch { return { material: item, result: null }; }
  }), [materials, vehicle, selectedParts, product]);
  const result = useMemo(() => {
    if (!vehicle || !material || !selectedParts.length) return null;
    try { return calculateWrappingPrice({ product, vehicle, material, selectedParts }); } catch { return null; }
  }, [product, vehicle, material, selectedParts]);

  const canContinue = (() => {
    if (currentStep === "type") return Boolean(typeId);
    if (currentStep === "model") return Boolean(vehicleId);
    if (currentStep === "parts") return partIds.length > 0;
    if (currentStep === "material") return Boolean(materialId && product);
    return Boolean(result);
  })();

  const next = () => {
    if (!canContinue) return;
    setError("");
    setStep((value) => Math.min(steps.length - 1, value + 1));
  };
  const back = () => {
    setError("");
    setStep((value) => Math.max(0, value - 1));
  };
  const togglePart = (id) => setPartIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  if (loading) return <div className="wrapping-loading"><div className="spinner" /><strong>Preparando wizard...</strong></div>;

  return <div className="wrapping-wizard">
    <div className="wrapping-stepper">{steps.map((item, index) => <div className={`wrapping-step ${index === step ? "active" : ""} ${index < step ? "done" : ""}`} key={item.key}><span>{index < step ? <Check size={13} /> : index + 1}</span><small>{item.label}</small></div>)}</div>
    {error ? <div className="form-alert error">{error}</div> : null}

    <div className="wrapping-content">
      {currentStep === "type" ? <><h3>Qual o tipo de veículo?</h3><div className="wizard-choice-grid">{types.map((type) => <button type="button" className={typeId === type.id ? "selected" : ""} key={type.id} onClick={() => { setTypeId(type.id); setVehicleId(""); setPartIds([]); }}>{type.name}</button>)}</div></> : null}

      {currentStep === "model" ? <><h3>Escolha o modelo</h3><div className="wizard-choice-grid models">{filteredVehicles.map((item) => <button type="button" className={vehicleId === item.id ? "selected" : ""} key={item.id} onClick={() => { setVehicleId(item.id); setPartIds([]); }}><strong>{item.brand} {item.model}</strong><small>{item.parts.filter((p) => p.active !== false).length} peças cadastradas</small></button>)}</div>{!filteredVehicles.length ? <p className="wizard-hint">Nenhum modelo ativo desse tipo. Cadastre em Envelopamento.</p> : null}</> : null}

      {currentStep === "parts" ? <><div className="wizard-title-row"><h3>Quais peças serão envelopadas?</h3><button type="button" className="text-button" onClick={() => setPartIds((vehicle?.parts || []).filter((p) => p.active !== false).map((p) => p.id))}>Selecionar todas</button></div><div className="wizard-parts">{(vehicle?.parts || []).filter((p) => p.active !== false).map((part) => <label className={partIds.includes(part.id) ? "selected" : ""} key={part.id}><input type="checkbox" checked={partIds.includes(part.id)} onChange={() => togglePart(part.id)} /><span><strong>{part.name}</strong><small>{part.area_m2} m² · {part.waste_percent}% perda · dificuldade {part.difficulty_multiplier}×</small></span></label>)}</div></> : null}

      {currentStep === "material" ? <>
        <div className="wizard-title-row"><div><h3>Escolha o material</h3><p className="wizard-hint">Compare visualmente e pelo valor final. Você pode trocar quantas vezes quiser antes de continuar.</p></div></div>
        {!suppliedProduct ? <label className="wizard-field"><span>Produto/serviço</span><select value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Selecione...</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : null}
        <div className="wizard-materials material-price-choices">
          {materialOptions.map(({ material: item, result: itemResult }) => <button type="button" className={materialId === item.id ? "selected" : ""} key={item.id} onClick={() => setMaterialId(item.id)}>
            <div className="wizard-material-thumb">{materialImages[item.id] ? <img src={materialImages[item.id]} alt="" /> : <span>Sem imagem</span>}</div>
            <div className="wizard-material-copy">
              <strong>{item.name}</strong>
              <small>Referência: {item.sale_value !== "" && item.sale_value != null ? `${money(item.sale_value)} / m²` : "não informada"}</small>
              <small>Multiplicador: {Number(item.wrapping_multiplier || 1).toLocaleString("pt-BR")}×{Number(item.wrapping_discount_percent || 0) > 0 ? ` · desconto ${Number(item.wrapping_discount_percent).toLocaleString("pt-BR")}%` : ""}</small>
              <span className="wizard-material-service-price">{itemResult ? <>Serviço com este material <strong>{money(itemResult.final_total)}</strong></> : "Complete veículo e peças para calcular"}</span>
            </div>
          </button>)}
        </div>
        {!materials.length ? <p className="wizard-hint">Cadastre materiais ativos marcados para envelopamento.</p> : null}
      </> : null}

      {currentStep === "summary" && result ? <><div className="wizard-summary-head"><div><WandSparkles size={20} /><div><h3>Resumo do envelopamento</h3><p>{vehicle.brand} {vehicle.model} · {material.name}</p></div></div><strong>{money(result.final_total)}</strong></div><div className="wizard-summary-metrics"><div><span>Peças</span><strong>{selectedParts.length}</strong></div><div><span>Área real</span><strong>{result.metrics.area_m2} m²</strong></div><div><span>Área c/ perda</span><strong>{result.metrics.charged_area_m2} m²</strong></div><div><span>Tempo estimado</span><strong>{Math.floor(result.metrics.install_minutes / 60)}h {result.metrics.install_minutes % 60}min</strong></div></div><div className="wizard-summary-parts">{result.snapshot.parts.map((part) => <div key={part.id || part.name}><span>{part.name}</span><strong>{money(part.subtotal)}</strong></div>)}</div><div className="mode-info-box"><span>Material base: {money(result.snapshot.material.base_price_m2)}/m²</span><span>Multiplicador do material: {result.snapshot.material.multiplier}×</span><span>Desconto do material: {result.snapshot.material.discount_percent}%</span><span>Material efetivo: {money(result.snapshot.material.price_m2)}/m²</span></div><p className="wizard-hint">O snapshot guarda veículo, peças, material, parâmetros e valores usados. Alterações futuras nos cadastros não mudam este cálculo.</p></> : null}
    </div>

    <div className="wrapping-footer"><button className="secondary-button" type="button" onClick={step ? back : onCancel}>{step ? <><ArrowLeft size={16} /> Voltar</> : "Cancelar"}</button>{currentStep !== "summary" ? <button className="primary-button" type="button" disabled={!canContinue} onClick={next}>Continuar <ArrowRight size={16} /></button> : <button className="primary-button" type="button" disabled={!result} onClick={() => onComplete?.(result)}><Check size={16} /> Usar no orçamento</button>}</div>
  </div>;
}
