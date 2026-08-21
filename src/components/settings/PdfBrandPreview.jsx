import { formatAddress, formatContact, formatDocumentLine } from "../../lib/quotePdf";

export default function PdfBrandPreview({ settings, logoUrl }) {
  const businessName = settings.trade_name || settings.legal_name || "Sua empresa";
  const legalName = settings.legal_name && settings.legal_name !== businessName ? settings.legal_name : "";
  const document = formatDocumentLine(settings);
  const contact = formatContact(settings);
  const address = formatAddress(settings);

  return (
    <div className="pdf-preview" style={{ "--preview-accent": settings.primary_color }}>
      <div className="pdf-preview-top">
        <div className="pdf-preview-brand">
          {logoUrl ? (
            <img src={logoUrl} alt="" />
          ) : (
            <div className="pdf-preview-logo-placeholder">LOGO</div>
          )}
          <div>
            <strong>{businessName}</strong>
            {legalName ? <span>{legalName}</span> : null}
            {document ? <span>{document}</span> : null}
            {contact ? <span>{contact}</span> : null}
            {address ? <span className="pre-line">{address}</span> : null}
          </div>
        </div>
        <div className="pdf-preview-number">
          <small>ORÇAMENTO</small>
          <strong>#0001</strong>
        </div>
      </div>

      <div className="pdf-preview-line" />

      <div className="pdf-preview-grid">
        <div><small>Cliente</small><strong>Cliente de exemplo</strong></div>
        <div><small>Validade</small><strong>{settings.default_quote_validity_days} dias</strong></div>
      </div>

      <div className="pdf-preview-item">
        <span>Produto ou serviço</span>
        <strong>R$ 1.250,00</strong>
      </div>

      <div className="pdf-preview-total">
        <span>Total</span>
        <strong>R$ 1.250,00</strong>
      </div>

      <p className="pdf-preview-note">
        {settings.default_quote_message || "Sua mensagem padrão aparecerá aqui."}
      </p>
    </div>
  );
}
