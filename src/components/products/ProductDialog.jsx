import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { EMPTY_PRODUCT, EMPTY_TIER, normalizeProduct, validateProduct } from "../../lib/product";
import { createProductCategory, saveProduct } from "../../services/productService";
import ProductForm from "./ProductForm";

function errorMessage(error) {
  if (!(error instanceof Error)) return "Ocorreu um erro inesperado.";
  if (/product_categories_workspace_name_unique/i.test(error.message)) return "Já existe uma categoria com esse nome.";
  return error.message;
}

export default function ProductDialog({
  open,
  workspaceId,
  product = null,
  categories,
  materials = [],
  onClose,
  onSaved,
  onCategoryCreated,
}) {
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [tiers, setTiers] = useState([]);
  const [errors, setErrors] = useState({});
  const [tierErrors, setTierErrors] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(normalizeProduct(product || EMPTY_PRODUCT));
    setTiers(
      product?.tiers?.length
        ? product.tiers
        : product?.calculation_mode === "quantity_tier"
          ? [{ ...EMPTY_TIER }]
          : [],
    );
    setErrors({});
    setTierErrors([]);
    setStatus("");
  }, [open, product]);

  if (!open) return null;

  const update = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "calculation_mode") {
        if (value === "square_meter") next.unit_label = "m²";
        if (value === "fluid_curve") next.unit_label = "curva";
        if (value === "linear_meter") next.unit_label = "m";
        if (value === "unit") next.unit_label = "un";
        if (value === "material_resale") next.unit_label = "un";
        if (value === "fixed") next.unit_label = "serviço";
        if (value === "manual") next.unit_label = "item";
        if (value === "wrapping") next.unit_label = "veículo";
      }

      return next;
    });
    setErrors((current) => ({ ...current, [field]: "" }));
    setStatus("");
  };

  const createCategory = async () => {
    const name = window.prompt("Nome da nova categoria:");
    if (!name?.trim()) return;

    try {
      const category = await createProductCategory(workspaceId, name);
      onCategoryCreated?.(category);
      update("category_id", category.id);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    const validation = validateProduct(form, tiers);
    setErrors(validation.errors);
    setTierErrors(validation.tierErrors);

    if (!validation.valid) return;

    setBusy(true);
    setStatus("");

    try {
      await saveProduct(workspaceId, product?.id || null, validation.product, validation.tiers);
      onSaved?.();
      onClose();
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <header className="dialog-header">
          <div>
            <h2 id="product-dialog-title">{product?.id ? "Editar produto ou serviço" : "Novo produto ou serviço"}</h2>
            <p>Configure uma vez para o orçamento calcular e preencher automaticamente depois.</p>
          </div>
          <button className="dialog-close" type="button" disabled={busy} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={submit}>
          <div className="dialog-body">
            {status ? <div className="form-alert error">{status}</div> : null}
            <ProductForm
              value={form}
              categories={categories}
              tiers={tiers}
              errors={errors}
              tierErrors={tierErrors}
              onChange={update}
              onTiersChange={setTiers}
              onCreateCategory={createCategory}
              materials={materials}
            />
          </div>

          <footer className="dialog-footer">
            <button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Cancelar</button>
            <button className="primary-button dialog-save" type="submit" disabled={busy}>
              {busy ? "Salvando..." : product?.id ? "Salvar alterações" : "Cadastrar"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
