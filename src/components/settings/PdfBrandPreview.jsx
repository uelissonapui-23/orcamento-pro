export default function PdfBrandPreview({ settings, logoUrl }) {
  const businessName = settings.trade_name || settings.legal_name || "Sua empresa";

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
            <span>{settings.document || "CPF/CNPJ"}</span>
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
