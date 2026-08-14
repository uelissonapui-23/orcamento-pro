import { CALCULATION_MODES, calculationModeMeta } from "../../lib/product";
import PriceTiersEditor from "./PriceTiersEditor";
import PricingPreview from "./PricingPreview";
import FluidCurveEditor from "./FluidCurveEditor";

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

        {mode === "fluid_curve" ? <FluidCurveEditor value={value} onChange={onChange} errors={errors} /> : null}

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

        {mode === "wrapping" ? (() => {
          const wrapping = value.configuration_json?.wrapping || {};
          const updateWrapping = (field, nextValue) => onChange("configuration_json", {
            ...value.configuration_json,
            wrapping: { ...wrapping, [field]: nextValue },
          });

          return (
            <div className="wrapping-product-config">
              <div className="mode-info-box accent">
                <strong>Material escolhido no orçamento</strong>
                <p>O multiplicador, desconto e imagem ficam configurados em cada material. Aqui você define apenas ajustes gerais do serviço.</p>
              </div>

              <div className="product-form-grid">
                <label>
                  <span>Adicional padrão do serviço</span>
                  <div className="suffix-input">
                    <input inputMode="decimal" value={wrapping.extra_percent ?? "0"} onChange={(e) => updateWrapping("extra_percent", e.target.value)} placeholder="0" />
                    <span>%</span>
                  </div>
                  <small>Opcional. Aplicado ao valor calculado com o material escolhido.</small>
                  {errors.wrapping_extra_percent ? <small className="field-error">{errors.wrapping_extra_percent}</small> : null}
                </label>

                <label>
                  <span>Adicional fixo do serviço</span>
                  <div className="money-input">
                    <span>R$</span>
                    <input inputMode="decimal" value={wrapping.extra_fixed ?? "0"} onChange={(e) => updateWrapping("extra_fixed", e.target.value)} placeholder="0,00" />
                  </div>
                  {errors.wrapping_extra_fixed ? <small className="field-error">{errors.wrapping_extra_fixed}</small> : null}
                </label>
              </div>

              <div className="mode-info-box">
                <strong>Como funciona no orçamento</strong>
                <p>Depois de escolher veículo e peças, o wizard mostra todos os materiais disponíveis com miniatura e o valor final do serviço para cada opção. Basta tocar para comparar e trocar.</p>
              </div>
            </div>
          );
        })() : null}
      </div>

      <PricingPreview product={value} tiers={tiers} />
    </div>
  );
}
