import { formatBRL } from "../../lib/money";

export default function QuoteTotals({ quote, onChange }) {
  return (
    <section className="quote-totals">
      <div className="quote-totals-adjustments">
        <label>
          <span>Tipo de desconto</span>
          <select value={quote.discount_type} onChange={(e) => onChange("discount_type", e.target.value)}>
            <option value="fixed">Valor em R$</option>
            <option value="percent">Percentual</option>
          </select>
        </label>

        <label>
          <span>{quote.discount_type === "percent" ? "Desconto (%)" : "Desconto (R$)"}</span>
          <input inputMode="decimal" value={quote.discount_value} onChange={(e) => onChange("discount_value", e.target.value)} />
        </label>

        <label>
          <span>Adicional (R$)</span>
          <input inputMode="decimal" value={quote.surcharge_value} onChange={(e) => onChange("surcharge_value", e.target.value)} />
        </label>
      </div>

      <div className="quote-total-summary">
        <div><span>Subtotal</span><strong>{formatBRL(quote.subtotal)}</strong></div>
        {quote.surcharge_total > 0 ? <div><span>Adicional</span><strong>+ {formatBRL(quote.surcharge_total)}</strong></div> : null}
        {quote.discount_total > 0 ? <div><span>Desconto</span><strong>- {formatBRL(quote.discount_total)}</strong></div> : null}
        <div className="grand"><span>Total</span><strong>{formatBRL(quote.total)}</strong></div>
      </div>
    </section>
  );
}
