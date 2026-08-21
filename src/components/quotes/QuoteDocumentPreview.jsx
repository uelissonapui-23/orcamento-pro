import { formatBRL } from "../../lib/money";
import {
  formatQuoteDate,
  quotePdfViewModel,
} from "../../lib/quotePdf";

export default function QuoteDocumentPreview({ quote, business, logoUrl }) {
  const vm = quotePdfViewModel(quote, business);

  return (
    <div className="pdf-sheet" style={{ "--pdf-accent": vm.primaryColor }}>
      <header className="pdf-header">
        <div className="pdf-brand">
          {logoUrl ? <img src={logoUrl} alt="" /> : <div className="pdf-logo-placeholder">{vm.companyName.slice(0, 1).toUpperCase()}</div>}
          <div>
            <h2>{vm.companyName}</h2>
            {vm.companyLegalName ? <span>{vm.companyLegalName}</span> : null}
            {vm.companyDocument ? <span>{vm.companyDocument}</span> : null}
            {vm.companyContact ? <span>{vm.companyContact}</span> : null}
            {vm.companyAddress ? <span className="pre-line">{vm.companyAddress}</span> : null}
          </div>
        </div>
        <div className="pdf-document-card">
          <div className="pdf-number">
            <span>ORÇAMENTO</span>
            <strong>{vm.quoteNumber}</strong>
          </div>
          <div className="pdf-document-dates">
            <div><span>Emissão</span><strong>{vm.issueDate}</strong></div>
            <div><span>Validade</span><strong>{vm.validUntil}</strong></div>
          </div>
        </div>
      </header>

      <div className="pdf-accent-line" />

      <section className="pdf-client-panel">
        <div className="pdf-client">
          <span>CLIENTE</span>
          <h3>{vm.clientName}</h3>
          {vm.clientTradeName ? <p>{vm.clientTradeName}</p> : null}
          {vm.clientDocument ? <p>{vm.clientDocument}</p> : null}
          {vm.clientContact ? <p>{vm.clientContact}</p> : null}
          {vm.clientAddress ? <p className="pre-line">{vm.clientAddress}</p> : null}
        </div>
        <div className="pdf-delivery-card"><span>Prazo de entrega</span><strong>{vm.deliveryTerm}</strong></div>
      </section>

      <section className="pdf-items">
        <h3>Itens do orçamento</h3>
        <div className="pdf-items-head">
          <span>Descrição</span><span>Qtd.</span><span>Valor normal</span><span>Valor a pagar</span>
        </div>
        {(quote.items || []).map((item, index) => (
          <div className="pdf-item-row" key={item.id || item.local_id || index}>
            <div>
              <strong>{item.description}</strong>
              <span>
                {item.calculation_mode === "square_meter" && item.area ? `${item.area} m²` : null}
                {item.calculation_mode === "linear_meter" && item.linear_meters ? `${item.linear_meters} m` : null}
                {item.notes ? `${item.area || item.linear_meters ? " · " : ""}${item.notes}` : null}
              </span>
            </div>
            <span>{item.quantity}</span>
            <span>{formatBRL(item.gross_total_price ?? item.total_price)}</span>
            <strong>{formatBRL(item.total_price)}</strong>
          </div>
        ))}
      </section>

      <section className="pdf-total-section">
        <div className="pdf-total-box">
          <div><span>Subtotal sem desconto</span><strong>{vm.grossSubtotal}</strong></div>
          {Number(quote.surcharge_total) > 0 ? <div><span>Acréscimos</span><strong>+ {vm.surcharge}</strong></div> : null}
          {(vm.itemDiscountValue > 0 || Number(quote.discount_total) > 0) ? <div><span>Desconto total</span><strong>- {vm.totalDiscount}</strong></div> : null}
          <div className="grand"><span>Valor a pagar</span><strong>{vm.total}</strong></div>
        </div>
      </section>

      <section className="pdf-text-blocks">
        {quote.payment_terms_snapshot ? <div><h4>Condição de pagamento</h4><p>{quote.payment_terms_snapshot}</p></div> : null}
        {quote.message_snapshot ? <div><h4>Mensagem</h4><p>{quote.message_snapshot}</p></div> : null}
        {quote.notes_snapshot ? <div><h4>Observações</h4><p>{quote.notes_snapshot}</p></div> : null}
        {quote.terms_snapshot ? <div><h4>Termos e condições</h4><p>{quote.terms_snapshot}</p></div> : null}
      </section>

      <footer className="pdf-footer">
        <span>{vm.companyName}</span>
        <span>Orçamento {vm.quoteNumber} · {formatQuoteDate(quote.issue_date)}</span>
      </footer>
    </div>
  );
}
