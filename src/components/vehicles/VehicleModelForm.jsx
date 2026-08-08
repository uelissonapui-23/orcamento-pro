import VehiclePartsEditor from "./VehiclePartsEditor";

export default function VehicleModelForm({
  value,
  types,
  parts,
  errors,
  partErrors,
  onChange,
  onPartsChange,
  onCreateType,
}) {
  const update = (field) => (event) => onChange(field, event.target.value);

  return (
    <div className="vehicle-model-form">
      <div className="vehicle-model-grid">
        <label>
          <span>Tipo de veículo *</span>
          <div className="category-select-row">
            <select value={value.vehicle_type_id} onChange={update("vehicle_type_id")}>
              <option value="">Escolha...</option>
              {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
            <button className="compact-add" type="button" onClick={onCreateType}>+</button>
          </div>
          {errors.vehicle_type_id ? <small className="field-error">{errors.vehicle_type_id}</small> : null}
        </label>

        <label>
          <span>Marca *</span>
          <input value={value.brand} onChange={update("brand")} placeholder="Ex.: Fiat" />
          {errors.brand ? <small className="field-error">{errors.brand}</small> : null}
        </label>

        <label>
          <span>Modelo *</span>
          <input value={value.model} onChange={update("model")} placeholder="Ex.: Toro" />
          {errors.model ? <small className="field-error">{errors.model}</small> : null}
        </label>

        <label>
          <span>Ano inicial</span>
          <input type="number" min="1900" max="2200" value={value.year_from} onChange={update("year_from")} />
          {errors.year_from ? <small className="field-error">{errors.year_from}</small> : null}
        </label>

        <label>
          <span>Ano final</span>
          <input type="number" min="1900" max="2200" value={value.year_to} onChange={update("year_to")} placeholder="Vazio = atual" />
          {errors.year_to ? <small className="field-error">{errors.year_to}</small> : null}
        </label>

        <label className="vehicle-form-full">
          <span>Observações</span>
          <textarea rows="3" value={value.notes} onChange={update("notes")} placeholder="Versão, cabine, geração ou informação útil." />
        </label>
      </div>

      <VehiclePartsEditor parts={parts} errors={partErrors} onChange={onPartsChange} />
    </div>
  );
}
