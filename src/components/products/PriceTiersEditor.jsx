import { Plus, Trash2 } from "lucide-react";
import { EMPTY_TIER, normalizeTier } from "../../lib/product";

export default function PriceTiersEditor({ tiers, errors = [], generalError, onChange }) {
  const update = (index, field, value) => {
    onChange(
      tiers.map((tier, currentIndex) =>
        currentIndex === index ? normalizeTier({ ...tier, [field]: value }) : tier,
      ),
    );
  };

  const add = () => {
    const last = tiers[tiers.length - 1];
    const nextMin = last?.max_quantity ? Number(last.max_quantity) + 1 : tiers.length ? 1 : 1;

    onChange([
      ...tiers,
      {
        ...EMPTY_TIER,
        min_quantity: nextMin,
      },
    ]);
  };

  const remove = (index) => onChange(tiers.filter((_, currentIndex) => currentIndex !== index));

  return (
    <div className="tiers-editor">
      <div className="tiers-head">
        <div>
          <strong>Faixas de quantidade</strong>
          <span>O máximo vazio significa “a partir de”.</span>
        </div>
        <button className="secondary-button" type="button" onClick={add}>
          <Plus size={16} /> Adicionar faixa
        </button>
      </div>

      {generalError ? <small className="field-error">{generalError}</small> : null}

      <div className="tiers-list">
        {tiers.map((tier, index) => (
          <div className="tier-row" key={`${index}-${tier.min_quantity}`}>
            <label>
              <span>De</span>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={tier.min_quantity}
                onChange={(e) => update(index, "min_quantity", e.target.value)}
              />
              {errors[index]?.min_quantity ? <small className="field-error">{errors[index].min_quantity}</small> : null}
            </label>

            <label>
              <span>Até</span>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Sem limite"
                value={tier.max_quantity}
                onChange={(e) => update(index, "max_quantity", e.target.value)}
              />
              {errors[index]?.max_quantity ? <small className="field-error">{errors[index].max_quantity}</small> : null}
            </label>

            <label>
              <span>Preço</span>
              <input
                inputMode="decimal"
                value={tier.price}
                onChange={(e) => update(index, "price", e.target.value)}
                placeholder="0,00"
              />
              {errors[index]?.price ? <small className="field-error">{errors[index].price}</small> : null}
            </label>

            <label>
              <span>Como cobrar</span>
              <select value={tier.price_mode} onChange={(e) => update(index, "price_mode", e.target.value)}>
                <option value="total">Valor total da faixa</option>
                <option value="unit">Preço por unidade</option>
              </select>
            </label>

            <button className="tier-delete" type="button" onClick={() => remove(index)} aria-label="Remover faixa">
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>

      {!tiers.length ? (
        <div className="tiers-empty">Adicione a primeira faixa para configurar este produto.</div>
      ) : null}
    </div>
  );
}
