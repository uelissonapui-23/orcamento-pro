import { Calculator, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { calculationModeMeta } from "../../lib/product";
import { formatBRL } from "../../lib/money";
import { priceProductForQuote } from "../../services/quoteItemPricingService";
import { createMaterialImageUrl } from "../../services/materialService";
import WrappingWizardDialog from "../wrapping/WrappingWizardDialog";

function initialInputs(mode) {
  if (mode === "square_meter") return { width: "", height: "", quantity: "1" };
  if (mode === "linear_meter") return { length: "", quantity: "1" };
  if (mode === "manual") return { manual_price: "", quantity: "1" };
  if (mode === "material_resale") return { quantity: "1", material_id: "", measurements: [{ width: "", height: "", quantity: "1" }], use_overlap: false };
  return { quantity: "1" };
}

function materialSalePrice(material, product) {
  const config = product.configuration_json?.material_resale || {};
  const base = Number(config.price_source === "reference" ? material.sale_value : material.cost_value);
  const percent = Number(config.profit_percent || 0);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(percent) || percent < 0) return null;
  if (config.profit_mode === "margin") {
    if (percent >= 100) return null;
    return base / (1 - percent / 100);
  }
  return base * (1 + percent / 100);
}

function MaterialThumbnail({ material }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    setUrl("");
    if (material.image_path) {
      createMaterialImageUrl(material.image_path)
        .then((nextUrl) => active && setUrl(nextUrl))
        .catch(() => active && setUrl(""));
    }
    return () => { active = false; };
  }, [material.image_path]);

  return <div className="wizard-material-thumb">{url ? <img src={url} alt={material.name} /> : <span>Sem imagem</span>}</div>;
}

export default function AddQuoteItemDialog({ open, workspaceId, products, materials = [], onClose, onAdd }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [inputs, setInputs] = useState({ quantity: "1" });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [wrappingOpen, setWrappingOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedId("");
    setInputs({ quantity: "1" });
    setNotes("");
    setError("");
    setWrappingOpen(false);
    setMaterialSearch("");
  }, [open]);

  const selected = products.find((item) => item.id === selectedId) || null;
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((item) => item.active !== false && (!term || item.name.toLowerCase().includes(term)));
  }, [products, search]);
  const filteredMaterials = useMemo(() => {
    const term = materialSearch.trim().toLowerCase();
    return materials.filter((item) => item.active !== false && (!term || item.name.toLowerCase().includes(term)));
  }, [materials, materialSearch]);
  const resalePreview = useMemo(() => {
    if (selected?.calculation_mode !== "material_resale" || !inputs.material_id) return null;
    const material = materials.find((item) => item.id === inputs.material_id);
    if (!material) return null;
    try {
      return priceProductForQuote({ product: { ...selected, default_material: material }, formValues: inputs, tiers: selected.tiers || [] });
    } catch {
      return null;
    }
  }, [selected, inputs, materials]);

  if (!open) return null;

  const select = (product) => {
    setSelectedId(product.id);
    setInputs(initialInputs(product.calculation_mode));
    setNotes("");
    setError("");
    if (product.calculation_mode === "wrapping") setWrappingOpen(true);
  };

  const calculate = () => {
    if (!selected) return;

    try {
      const selectedMaterial = selected.calculation_mode === "material_resale"
        ? materials.find((item) => item.id === inputs.material_id)
        : null;
      if (selected.calculation_mode === "material_resale" && !selectedMaterial) {
        setError("Escolha o material que será vendido.");
        return;
      }
      const result = priceProductForQuote({
        product: selectedMaterial ? { ...selected, default_material: selectedMaterial } : selected,
        formValues: inputs,
        tiers: selected.tiers || [],
      });

      if (result.status !== "calculated") {
        setError("Este item precisa do wizard.");
        return;
      }

      onAdd({
        ...result.quoteItemDraft,
        local_id: crypto.randomUUID(),
        notes,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível calcular o item.");
    }
  };

  return (
    <>
      {!wrappingOpen ? (
      <div className="dialog-backdrop quote-item-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <section className="quote-item-dialog" role="dialog" aria-modal="true">
          <header className="dialog-header">
            <div>
              <h2>Adicionar item</h2>
              <p>Escolha o produto. O app mostra somente os campos necessários.</p>
            </div>
            <button className="dialog-close" type="button" onClick={onClose}><X size={20} /></button>
          </header>

          <div className="dialog-body">
            <div className="quote-product-search">
              <Search size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou serviço..." />
            </div>

            {!selected ? (
              <div className="quote-product-grid">
                {filtered.map((product) => {
                  const meta = calculationModeMeta(product.calculation_mode);
                  return (
                    <button type="button" key={product.id} onClick={() => select(product)}>
                      <span className="quote-product-mode">{meta.shortLabel}</span>
                      <span>
                        <strong>{product.name}</strong>
                        <small>{product.category?.name || "Geral"} · {meta.label}</small>
                      </span>
                    </button>
                  );
                })}
                {!filtered.length ? <div className="quote-product-empty">Nenhum produto encontrado.</div> : null}
              </div>
            ) : (
              <div className="quote-item-config">
                <button className="quote-change-product" type="button" onClick={() => setSelectedId("")}>← Trocar produto</button>
                <div className="quote-selected-product">
                  <div>
                    <strong>{selected.name}</strong>
                    <span>{calculationModeMeta(selected.calculation_mode).label}</span>
                  </div>
                  {!["manual", "wrapping", "material_resale"].includes(selected.calculation_mode) && selected.base_price !== "" ? (
                    <b>{formatBRL(selected.base_price)}</b>
                  ) : null}
                </div>

                {selected.calculation_mode === "square_meter" ? (
                  <div className="quote-item-fields">
                    <label><span>Largura (m)</span><input inputMode="decimal" value={inputs.width || ""} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} /></label>
                    <label><span>Altura (m)</span><input inputMode="decimal" value={inputs.height || ""} onChange={(e) => setInputs({ ...inputs, height: e.target.value })} /></label>
                    <label><span>Quantidade</span><input type="number" min="1" value={inputs.quantity || "1"} onChange={(e) => setInputs({ ...inputs, quantity: e.target.value })} /></label>
                  </div>
                ) : null}

                {selected.calculation_mode === "linear_meter" ? (
                  <div className="quote-item-fields">
                    <label><span>Comprimento (m)</span><input inputMode="decimal" value={inputs.length || ""} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} /></label>
                    <label><span>Quantidade</span><input type="number" min="1" value={inputs.quantity || "1"} onChange={(e) => setInputs({ ...inputs, quantity: e.target.value })} /></label>
                  </div>
                ) : null}

                {["unit", "quantity_tier", "fixed"].includes(selected.calculation_mode) ? (
                  <div className="quote-item-fields one">
                    <label><span>Quantidade</span><input type="number" min="1" value={inputs.quantity || "1"} onChange={(e) => setInputs({ ...inputs, quantity: e.target.value })} /></label>
                  </div>
                ) : null}

                {selected.calculation_mode === "manual" ? (
                  <div className="quote-item-fields">
                    <label><span>Valor total</span><input inputMode="decimal" value={inputs.manual_price || ""} onChange={(e) => setInputs({ ...inputs, manual_price: e.target.value })} /></label>
                    <label><span>Quantidade</span><input type="number" min="1" value={inputs.quantity || "1"} onChange={(e) => setInputs({ ...inputs, quantity: e.target.value })} /></label>
                  </div>
                ) : null}

                {selected.calculation_mode === "material_resale" ? (
                  <div className="quote-material-selection">
                    <div className="quote-product-search">
                      <Search size={17} />
                      <input value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)} placeholder="Buscar material..." />
                    </div>
                    <div className="wizard-materials material-price-choices quote-material-picker">
                      {filteredMaterials.map((material) => {
                        const salePrice = materialSalePrice(material, selected);
                        return (
                          <button className={inputs.material_id === material.id ? "selected" : ""} type="button" key={material.id} onClick={() => { setInputs({ ...inputs, material_id: material.id }); setError(""); }}>
                            <MaterialThumbnail material={material} />
                            <span><strong>{material.name}</strong><small>{salePrice == null ? `${material.unit} · preço indisponível` : `${formatBRL(salePrice)} por ${material.unit}`}</small></span>
                          </button>
                        );
                      })}
                    </div>
                    {!filteredMaterials.length ? <div className="quote-product-empty">Nenhum material encontrado.</div> : null}
                    {selected.configuration_json?.material_resale?.measurement_mode === "area" ? (
                      <div className="quote-measurements-editor">
                        <div className="quote-measurements-heading"><strong>Medidas das peças</strong><span>Informe cada tamanho separadamente.</span></div>
                        {(inputs.measurements || []).map((measurement, index) => (
                          <div className="quote-measurement-row" key={index}>
                            <label><span>Largura (m)</span><input inputMode="decimal" value={measurement.width} onChange={(e) => setInputs({ ...inputs, measurements: inputs.measurements.map((item, itemIndex) => itemIndex === index ? { ...item, width: e.target.value } : item) })} /></label>
                            <label><span>Altura (m)</span><input inputMode="decimal" value={measurement.height} onChange={(e) => setInputs({ ...inputs, measurements: inputs.measurements.map((item, itemIndex) => itemIndex === index ? { ...item, height: e.target.value } : item) })} /></label>
                            <label><span>Quantidade</span><input type="number" min="1" value={measurement.quantity} onChange={(e) => setInputs({ ...inputs, measurements: inputs.measurements.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: e.target.value } : item) })} /></label>
                            {inputs.measurements.length > 1 ? <button className="dialog-close" type="button" onClick={() => setInputs({ ...inputs, measurements: inputs.measurements.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remover medida ${index + 1}`}><X size={17} /></button> : null}
                          </div>
                        ))}
                        <button className="secondary-button quote-add-measurement" type="button" onClick={() => setInputs({ ...inputs, measurements: [...inputs.measurements, { width: "", height: "", quantity: "1" }] })}><Plus size={16} /> Adicionar outra medida</button>
                        <label className="checkbox-label quote-overlap-toggle">
                          <input type="checkbox" checked={Boolean(inputs.use_overlap)} onChange={(e) => setInputs({ ...inputs, use_overlap: e.target.checked })} />
                          <span>Esta aplicação precisa de sobreposição entre folhas</span>
                        </label>
                        {resalePreview?.status === "calculated" ? <div className="quote-material-summary">
                          <span>Área das peças <strong>{resalePreview.metrics.total_area_m2} m²</strong></span>
                          {inputs.use_overlap ? <span>Sobreposição <strong>+ {resalePreview.metrics.overlap_area_m2} m²</strong></span> : null}
                          <span>Com desperdício <strong>{resalePreview.metrics.charged_area_m2} m²</strong></span>
                          <span>Valor final <strong>{formatBRL(resalePreview.final_total)}</strong></span>
                        </div> : null}
                      </div>
                    ) : <div className="quote-item-fields one">
                      <label><span>Quantidade</span><input type="number" min="1" value={inputs.quantity || "1"} onChange={(e) => setInputs({ ...inputs, quantity: e.target.value })} /></label>
                    </div>}
                  </div>
                ) : null}

                {selected.calculation_mode === "wrapping" ? (
                  <div className="quote-wrapping-cta">
                    <strong>Este item usa o wizard de envelopamento</strong>
                    <button className="primary-button" type="button" onClick={() => setWrappingOpen(true)}>Abrir wizard</button>
                  </div>
                ) : null}

                {selected.calculation_mode !== "wrapping" ? (
                  <label className="quote-item-notes">
                    <span>Observação do item</span>
                    <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
                  </label>
                ) : null}

                {error ? <div className="form-alert error">{error}</div> : null}
              </div>
            )}
          </div>

          {selected && selected.calculation_mode !== "wrapping" ? (
            <footer className="dialog-footer">
              <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
              <button className="primary-button dialog-save" type="button" onClick={calculate}>
                <Calculator size={16} /> Calcular e adicionar
              </button>
            </footer>
          ) : null}
        </section>
      </div>
      ) : null}

      <WrappingWizardDialog
        open={wrappingOpen}
        workspaceId={workspaceId}
        product={selected?.calculation_mode === "wrapping" ? selected : null}
        onClose={() => setWrappingOpen(false)}
        onComplete={(result) => {
          onAdd({
            ...result.quoteItemDraft,
            local_id: crypto.randomUUID(),
          });
          setWrappingOpen(false);
          onClose();
        }}
      />
    </>
  );
}
