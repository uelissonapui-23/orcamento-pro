import { CALCULATION_MODES, calculationModeMeta } from "../../lib/product";
import PriceTiersEditor from "./PriceTiersEditor";
import PricingPreview from "./PricingPreview";

export default function ProductForm({
  value,
  categories,
  tiers,
  errors,
  tierErrors,
  onChange,
  onTiersChange,
  onCreateCategory,
  materials = [],
}) {
  const mode = value.calculation_mode;
  const modeMeta = calculationModeMeta(mode);

  const update = (field) => (event) => onChange(field, event.target.value);

  return (
    <div className="product-form">
      <div className="product-form-grid">
        <label className="product-form-full">
          <span>Nome do produto ou serviço *</span>
          <input
            autoFocus
            value={value.name}
            onChange={update("name")}
            placeholder="Ex.: Adesivo impresso"
          />
          {errors.name ? <small className="field-error">{errors.name}</small> : null}
        </label>

        <label>
          <span>Categoria *</span>
          <div className="category-select-row">
            <select value={value.category_id} onChange={update("category_id")}>
              <option value="">Escolha...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <button className="compact-add" type="button" onClick={onCreateCategory} title="Nova categoria">+</button>
          </div>
          {errors.category_id ? <small className="field-error">{errors.category_id}</small> : null}
        </label>

        <label>
          <span>Como você cobra este item? *</span>
          <select value={mode} onChange={(e) => onChange("calculation_mode", e.target.value)}>
            {CALCULATION_MODES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <small>{modeMeta.description}</small>
        </label>

        <label className="product-form-full">
          <span>Descrição</span>
          <textarea
            rows="3"
            value={value.description}
            onChange={update("description")}
            placeholder="Descrição padrão que poderá aparecer no orçamento."
          />
        </label>

        <label className="product-form-full">
          <span>Material padrão</span>
          <select value={value.default_material_id || ""} onChange={update("default_material_id")}>
            <option value="">Nenhum material padrão</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} · {material.unit}
              </option>
            ))}
          </select>
          <small>Opcional. Ao adicionar este produto no orçamento, esse material poderá vir pré-selecionado.</small>
        </label>
      </div>

      <div className="product-price-panel">
        <div className="product-price-heading">
          <strong>Configuração de preço</strong>
          <span>Mostramos somente o que é necessário para {modeMeta.label.toLowerCase()}.</span>
        </div>

        {["square_meter", "linear_meter", "unit", "fixed"].includes(mode) ? (
          <div className="product-form-grid">
            <label>
              <span>
                {mode === "square_meter" ? "Preço por m²" :
                 mode === "linear_meter" ? "Preço por metro" :
                 mode === "unit" ? "Preço por unidade" : "Valor fixo"}
              </span>
              <div className="money-input">
                <span>R$</span>
                <input inputMode="decimal" value={value.base_price} onChange={update("base_price")} placeholder="0,00" />
              </div>
              {errors.base_price ? <small className="field-error">{errors.base_price}</small> : null}
            </label>

            {mode !== "fixed" ? (
              <label>
                <span>Valor mínimo</span>
                <div className="money-input">
                  <span>R$</span>
                  <input inputMode="decimal" value={value.minimum_price} onChange={update("minimum_price")} placeholder="Opcional" />
                </div>
                {errors.minimum_price ? <small className="field-error">{errors.minimum_price}</small> : null}
              </label>
            ) : null}

            {mode === "square_meter" ? (
              <label>
                <span>Desperdício padrão</span>
                <div className="suffix-input">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    inputMode="decimal"
                    value={value.waste_percent}
                    onChange={update("waste_percent")}
                  />
                  <span>%</span>
                </div>
                {errors.waste_percent ? <small className="field-error">{errors.waste_percent}</small> : null}
              </label>
            ) : null}

            {mode === "fixed" ? (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(value.configuration_json?.fixed_multiplies_quantity)}
                  onChange={(e) =>
                    onChange("configuration_json", {
                      ...value.configuration_json,
                      fixed_multiplies_quantity: e.target.checked,
                    })
                  }
                />
                <span>Multiplicar o valor fixo pela quantidade</span>
              </label>
            ) : null}
          </div>
        ) : null}

        {mode === "quantity_tier" ? (
          <PriceTiersEditor
            tiers={tiers}
            errors={tierErrors}
            generalError={errors.tiers}
            onChange={onTiersChange}
          />
        ) : null}

        {mode === "manual" ? (
          <div className="mode-info-box">
            <strong>Sem preço cadastrado</strong>
            <p>O valor será digitado somente quando este item for adicionado ao orçamento.</p>
          </div>
        ) : null}

        {mode === "wrapping" ? (
          <div className="mode-info-box accent">
            <strong>Calculado pelo wizard de envelopamento</strong>
            <p>Veículo, peças, material, área e preço serão definidos no wizard que construiremos na fase específica.</p>
          </div>
        ) : null}
      </div>

      <PricingPreview product={value} tiers={tiers} />
    </div>
  );
}
