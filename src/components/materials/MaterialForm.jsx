import { MATERIAL_UNITS } from "../../lib/material";

export default function MaterialForm({
  value,
  categories,
  errors,
  onChange,
  onCreateCategory,
}) {
  const update = (field) => (event) => onChange(field, event.target.value);

  return (
    <div className="material-form-grid">
      <label className="material-form-full">
        <span>Nome do material *</span>
        <input
          autoFocus
          value={value.name}
          onChange={update("name")}
          placeholder="Ex.: Vinil adesivo branco"
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
          <button className="compact-add" type="button" onClick={onCreateCategory}>+</button>
        </div>
        {errors.category_id ? <small className="field-error">{errors.category_id}</small> : null}
      </label>

      <label>
        <span>Unidade *</span>
        <input list="material-units" value={value.unit} onChange={update("unit")} />
        <datalist id="material-units">
          {MATERIAL_UNITS.map((unit) => <option key={unit} value={unit} />)}
        </datalist>
        {errors.unit ? <small className="field-error">{errors.unit}</small> : null}
      </label>

      <label>
        <span>Custo</span>
        <div className="money-input">
          <span>R$</span>
          <input inputMode="decimal" value={value.cost_value} onChange={update("cost_value")} placeholder="0,00" />
        </div>
        {errors.cost_value ? <small className="field-error">{errors.cost_value}</small> : null}
      </label>

      <label>
        <span>Preço de referência</span>
        <div className="money-input">
          <span>R$</span>
          <input inputMode="decimal" value={value.sale_value} onChange={update("sale_value")} placeholder="Opcional" />
        </div>
        {errors.sale_value ? <small className="field-error">{errors.sale_value}</small> : null}
      </label>

      <label>
        <span>Largura do rolo</span>
        <div className="suffix-input">
          <input
            inputMode="decimal"
            value={value.roll_width}
            onChange={update("roll_width")}
            placeholder="Ex.: 1,38"
          />
          <span>m</span>
        </div>
        <small>Obrigatória quando o material for usado no envelopamento.</small>
        {errors.roll_width ? <small className="field-error">{errors.roll_width}</small> : null}
      </label>

      <label className="checkbox-label material-wrap-check">
        <input
          type="checkbox"
          checked={value.use_in_wrapping}
          onChange={(e) => onChange("use_in_wrapping", e.target.checked)}
        />
        <span>Disponível no wizard de envelopamento</span>
      </label>

      <label className="material-form-full">
        <span>Observações</span>
        <textarea
          rows="4"
          value={value.notes}
          onChange={update("notes")}
          placeholder="Marca, linha, acabamento ou outras informações úteis."
        />
      </label>
    </div>
  );
}
