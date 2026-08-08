export default function ClientForm({ value, errors, onChange, quick = false }) {
  const update = (field) => (event) => onChange(field, event.target.value);

  return (
    <div className={`client-form-grid ${quick ? "quick" : ""}`}>
      <label className="client-form-full">
        <span>Nome *</span>
        <input autoFocus value={value.name} onChange={update("name")} placeholder="Nome do cliente" />
        {errors.name ? <small className="field-error">{errors.name}</small> : null}
      </label>

      {!quick ? (
        <label>
          <span>Empresa / nome fantasia</span>
          <input value={value.trade_name} onChange={update("trade_name")} />
        </label>
      ) : null}

      {!quick ? (
        <label>
          <span>CPF/CNPJ</span>
          <input inputMode="numeric" value={value.document} onChange={update("document")} />
        </label>
      ) : null}

      <label>
        <span>WhatsApp{quick ? " *" : ""}</span>
        <input inputMode="tel" value={value.whatsapp} onChange={update("whatsapp")} placeholder="(00) 00000-0000" />
        {errors.whatsapp ? <small className="field-error">{errors.whatsapp}</small> : null}
      </label>

      <label>
        <span>Telefone</span>
        <input inputMode="tel" value={value.phone} onChange={update("phone")} />
      </label>

      <label className={quick ? "client-form-full" : ""}>
        <span>E-mail</span>
        <input type="email" value={value.email} onChange={update("email")} />
        {errors.email ? <small className="field-error">{errors.email}</small> : null}
      </label>

      {!quick ? (
        <>
          <div className="client-form-divider client-form-full"><span>Endereço</span></div>

          <label>
            <span>CEP</span>
            <input inputMode="numeric" value={value.postal_code} onChange={update("postal_code")} />
          </label>

          <label>
            <span>Rua / Avenida</span>
            <input value={value.street} onChange={update("street")} />
          </label>

          <label>
            <span>Número</span>
            <input value={value.address_number} onChange={update("address_number")} />
          </label>

          <label>
            <span>Complemento</span>
            <input value={value.complement} onChange={update("complement")} />
          </label>

          <label>
            <span>Bairro</span>
            <input value={value.district} onChange={update("district")} />
          </label>

          <label>
            <span>Cidade</span>
            <input value={value.city} onChange={update("city")} />
          </label>

          <label>
            <span>UF</span>
            <input maxLength={2} value={value.state} onChange={(e) => onChange("state", e.target.value.toUpperCase())} />
          </label>

          <label className="client-form-full">
            <span>Observações</span>
            <textarea rows="4" value={value.notes} onChange={update("notes")} placeholder="Informações úteis sobre este cliente." />
          </label>
        </>
      ) : null}
    </div>
  );
}
