import { formatBRL } from "../../lib/money";

export default function QuoteTotals({ quote, onChange }) {
  const subtotal = Number(quote.subtotal || 0);
  const fixedDiscount = Number(quote.discount_total || 0);
  const percentDiscount = subtotal > 0 ? Math.round((fixedDiscount / subtotal) * 10000) / 100 : 0;
  const setDiscount = (type, value) => {
    onChange("discount_type", type);
    onChange("discount_value", value);
  };
  return (
    <section className="quote-totals">
      <div className="quote-totals-adjustments">
        <label>
          <span>Desconto geral (%)</span>
          <input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={quote.discount_type === "percent" ? quote.discount_value : percentDiscount} onChange={(e) => setDiscount("percent", e.target.value)} />
        </label>

        <label>
          <span>Desconto geral (R$)</span>
          <input inputMode="decimal" value={quote.discount_type === "fixed" ? quote.discount_value : fixedDiscount} onChange={(e) => setDiscount("fixed", e.target.value)} />
        </label>

        <label>
          <span>Adicional (R$)</span>
          <input inputMode="decimal" value={quote.surcharge_value} onChange={(e) => onChange("surcharge_value", e.target.value)} />
        </label>
      </div>

      <div className="quote-total-summary">
        <div><span>Subtotal bruto</span><strong>{formatBRL(quote.gross_subtotal ?? quote.subtotal)}</strong></div>
        {quote.item_discount_total > 0 ? <div><span>Descontos nos itens</span><strong>- {formatBRL(quote.item_discount_total)}</strong></div> : null}
        {quote.surcharge_total > 0 ? <div><span>Adicional</span><strong>+ {formatBRL(quote.surcharge_total)}</strong></div> : null}
        {quote.discount_total > 0 ? <div><span>Desconto geral</span><strong>- {formatBRL(quote.discount_total)}</strong></div> : null}
        {quote.total_discount > 0 ? <div className="quote-total-savings"><span>Economia do cliente</span><strong>{formatBRL(quote.total_discount)}</strong></div> : null}
        <div className="grand"><span>Total</span><strong>{formatBRL(quote.total)}</strong></div>
      </div>
    </section>
  );
}
