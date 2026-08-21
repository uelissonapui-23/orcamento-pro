import { Calculator, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { calculationModeMeta } from "../../lib/product";
import { formatBRL } from "../../lib/money";
import { priceProductForQuote } from "../../services/quoteItemPricingService";
import WrappingWizardDialog from "../wrapping/WrappingWizardDialog";

function initialInputs(mode) {
  if (mode === "square_meter") return { width: "", height: "", quantity: "1" };
  if (mode === "linear_meter") return { length: "", quantity: "1" };
  if (mode === "manual") return { manual_price: "", quantity: "1" };
  return { quantity: "1" };
}

export default function AddQuoteItemDialog({ open, workspaceId, products, onClose, onAdd }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [inputs, setInputs] = useState({ quantity: "1" });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [wrappingOpen, setWrappingOpen] = useState(false);

  const selected = products.find((item) => item.id === selectedId) || null;
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((item) => item.active !== false && (!term || item.name.toLowerCase().includes(term)));
  }, [products, search]);

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
      const result = priceProductForQuote({
        product: selected,
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
                  {selected.calculation_mode !== "manual" && selected.calculation_mode !== "wrapping" && selected.base_price !== "" ? (
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

                {["unit", "quantity_tier", "fixed", "material_resale"].includes(selected.calculation_mode) ? (
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

                {selected.calculation_mode === "material_resale" && selected.default_material ? (
                  <div className="mode-info-box accent">
                    <strong>{selected.default_material.name}</strong>
                    <p>O preço unitário será calculado automaticamente pela regra de lucro cadastrada.</p>
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
