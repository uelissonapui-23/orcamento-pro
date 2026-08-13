import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { formatBRL } from "../../lib/money";

export default function QuoteItemsEditor({ items, onAdd, onChange, error }) {
  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index) => {
    if (!window.confirm("Remover este item do orçamento?")) return;
    onChange(items.filter((_, current) => current !== index));
  };

  return (
    <section className="quote-editor-card">
      <div className="quote-card-heading">
        <div>
          <h2>Itens</h2>
          <p>Produtos, serviços e envelopamentos deste orçamento.</p>
        </div>
        <button className="primary-button" type="button" onClick={onAdd}><Plus size={17} /> Adicionar item</button>
      </div>

      {error ? <div className="form-alert error quote-items-error">{error}</div> : null}

      {items.length ? (
        <div className="quote-items-list">
          {items.map((item, index) => (
            <article className="quote-line-item" key={item.local_id || item.id || index}>
              <div className="quote-line-main">
                <strong>{item.description}</strong>
                <span>
                  {item.calculation_mode === "square_meter" && item.area ? `${item.area} m²` :
                   item.calculation_mode === "linear_meter" && item.linear_meters ? `${item.linear_meters} m` :
                   `Qtd. ${item.quantity}`}
                  {item.notes ? ` · ${item.notes}` : ""}
                </span>
              </div>
              <div className="quote-line-quantity">
                <small>Quantidade</small>
                <span>{Number(item.quantity || 1).toLocaleString("pt-BR")}</span>
              </div>
              <div className="quote-line-values">
                <small>Valor unitário</small>
                <span>{formatBRL(item.unit_price)}</span>
              </div>
              <div className="quote-line-total">
                <small>Total</small>
                <strong>{formatBRL(item.total_price)}</strong>
              </div>
              <div className="quote-line-actions">
                <button type="button" disabled={index === 0} onClick={() => move(index, -1)} title="Subir"><ArrowUp size={15} /></button>
                <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} title="Descer"><ArrowDown size={15} /></button>
                <button className="danger" type="button" onClick={() => remove(index)} title="Remover"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <button className="quote-items-empty" type="button" onClick={onAdd}>
          <Plus size={24} />
          <strong>Adicionar primeiro item</strong>
          <span>Escolha um produto/serviço e o app calcula o valor.</span>
        </button>
      )}
    </section>
  );
}
