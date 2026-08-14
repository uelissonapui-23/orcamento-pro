import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { EMPTY_VEHICLE_PART } from "../../lib/vehicle";

export default function VehiclePartsEditor({ parts, errors = [], onChange }) {
  const update = (index, field, value) => {
    onChange(
      parts.map((part, currentIndex) =>
        currentIndex === index ? { ...part, [field]: value } : part,
      ),
    );
  };

  const add = () => {
    onChange([
      ...parts,
      {
        ...EMPTY_VEHICLE_PART,
        sort_order: parts.length,
      },
    ]);
  };

  const remove = (index) => onChange(parts.filter((_, currentIndex) => currentIndex !== index));

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= parts.length) return;

    const next = [...parts];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((part, currentIndex) => ({ ...part, sort_order: currentIndex })));
  };

  return (
    <div className="vehicle-parts-editor">
      <div className="vehicle-parts-head">
        <div>
          <strong>Peças do veículo</strong>
          <span>Área, dificuldade, desperdício e tempo serão usados pelo wizard.</span>
        </div>
        <button className="secondary-button" type="button" onClick={add}>
          <Plus size={16} /> Adicionar peça
        </button>
      </div>

      <div className="vehicle-parts-list">
        {parts.map((part, index) => (
          <div className="vehicle-part-row" key={part.id || `vehicle-part-${index}`}>
            <label className="part-name">
              <span>Peça</span>
              <input value={part.name} onChange={(e) => update(index, "name", e.target.value)} placeholder="Ex.: Capô" />
              {errors[index]?.name ? <small className="field-error">{errors[index].name}</small> : null}
            </label>

            <label>
              <span>Área (m²)</span>
              <input inputMode="decimal" value={part.area_m2} onChange={(e) => update(index, "area_m2", e.target.value)} />
              {errors[index]?.area_m2 ? <small className="field-error">{errors[index].area_m2}</small> : null}
            </label>

            <label>
              <span>Dificuldade</span>
              <input inputMode="decimal" value={part.difficulty_multiplier} onChange={(e) => update(index, "difficulty_multiplier", e.target.value)} />
              {errors[index]?.difficulty_multiplier ? <small className="field-error">{errors[index].difficulty_multiplier}</small> : null}
            </label>

            <label>
              <span>Desperdício (%)</span>
              <input inputMode="decimal" value={part.waste_percent} onChange={(e) => update(index, "waste_percent", e.target.value)} />
              {errors[index]?.waste_percent ? <small className="field-error">{errors[index].waste_percent}</small> : null}
            </label>

            <label>
              <span>Tempo (min)</span>
              <input type="number" min="0" inputMode="numeric" value={part.install_minutes} onChange={(e) => update(index, "install_minutes", e.target.value)} />
              {errors[index]?.install_minutes ? <small className="field-error">{errors[index].install_minutes}</small> : null}
            </label>

            <div className="vehicle-part-actions">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} title="Subir"><ArrowUp size={15} /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === parts.length - 1} title="Descer"><ArrowDown size={15} /></button>
              <button className="danger" type="button" onClick={() => remove(index)} title="Remover"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {!parts.length ? (
        <div className="vehicle-parts-empty">Adicione as peças que poderão ser selecionadas no envelopamento.</div>
      ) : null}
    </div>
  );
}
