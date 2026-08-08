import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import LogoUploader from "../components/settings/LogoUploader";
import PdfBrandPreview from "../components/settings/PdfBrandPreview";
import SettingsSection from "../components/settings/SettingsSection";
import { useAuth } from "../contexts/AuthContext";
import {
  DEFAULT_BUSINESS_SETTINGS,
  normalizeBusinessSettings,
  validateBusinessSettings,
} from "../lib/businessSettings";
import {
  createLogoPreviewUrl,
  loadBusinessSettings,
  removeBusinessLogo,
  saveBusinessSettings,
  uploadBusinessLogo,
} from "../services/businessSettingsService";

function errorMessage(error) {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

export default function Settings() {
  const { workspace } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_BUSINESS_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_BUSINESS_SETTINGS);
  const [logoUrl, setLogoUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      if (!workspace?.id) return;

      setLoading(true);
      setStatus({ type: "", message: "" });

      try {
        const data = await loadBusinessSettings(workspace.id);
        const previewUrl = data.logo_path ? await createLogoPreviewUrl(data.logo_path) : "";

        if (!active) return;
        setSettings(data);
        setSavedSettings(data);
        setLogoUrl(previewUrl);
      } catch (error) {
        if (active) {
          setStatus({ type: "error", message: errorMessage(error) });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [workspace?.id]);

  const update = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setStatus({ type: "", message: "" });
  };

  const save = async (event) => {
    event.preventDefault();
    if (!workspace?.id) return;

    const validation = validateBusinessSettings(settings);
    setErrors(validation.errors);

    if (!validation.valid) {
      setStatus({ type: "error", message: "Revise os campos destacados antes de salvar." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const saved = await saveBusinessSettings(workspace.id, validation.normalized);
      setSettings(saved);
      setSavedSettings(saved);
      setStatus({ type: "success", message: "Configurações salvas." });
    } catch (error) {
      setStatus({ type: "error", message: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file) => {
    if (!workspace?.id) return;
    setLogoBusy(true);
    setStatus({ type: "", message: "" });

    try {
      const path = await uploadBusinessLogo(workspace.id, file, settings.logo_path);
      const url = await createLogoPreviewUrl(path);
      const next = normalizeBusinessSettings({ ...settings, logo_path: path });
      setSettings(next);
      setSavedSettings((current) => normalizeBusinessSettings({ ...current, logo_path: path }));
      setLogoUrl(url);
      setStatus({ type: "success", message: "Logo atualizada." });
    } catch (error) {
      setStatus({ type: "error", message: errorMessage(error) });
    } finally {
      setLogoBusy(false);
    }
  };

  const removeLogo = async () => {
    if (!workspace?.id || !settings.logo_path) return;
    setLogoBusy(true);
    setStatus({ type: "", message: "" });

    try {
      await removeBusinessLogo(workspace.id, settings.logo_path);
      const next = normalizeBusinessSettings({ ...settings, logo_path: "" });
      setSettings(next);
      setSavedSettings((current) => normalizeBusinessSettings({ ...current, logo_path: "" }));
      setLogoUrl("");
      setStatus({ type: "success", message: "Logo removida." });
    } catch (error) {
      setStatus({ type: "error", message: errorMessage(error) });
    } finally {
      setLogoBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner" />
        <strong>Carregando configurações...</strong>
      </div>
    );
  }

  return (
    <section>
      <div className="page-heading settings-heading">
        <div>
          <p className="eyebrow">CONFIGURAÇÕES</p>
          <h1>Empresa e orçamento</h1>
          <p>Configure uma vez. O app reutiliza automaticamente em novos orçamentos e PDFs.</p>
        </div>

        <button className="primary-button settings-save-top" disabled={saving || !dirty} form="business-settings-form" type="submit">
          <Save size={17} />
          {saving ? "Salvando..." : dirty ? "Salvar alterações" : "Tudo salvo"}
        </button>
      </div>

      {status.message ? <div className={`form-alert ${status.type} settings-alert`}>{status.message}</div> : null}

      <form id="business-settings-form" className="settings-page" onSubmit={save}>
        <div className="settings-main-column">
          <SettingsSection
            title="Dados da empresa"
            description="Informações que poderão aparecer no cabeçalho e rodapé dos seus orçamentos."
          >
            <div className="form-grid settings-form-grid">
              <label>
                <span>Nome do negócio *</span>
                <input
                  value={settings.trade_name}
                  onChange={(e) => update("trade_name", e.target.value)}
                  placeholder="Ex.: Comunicação Visual Silva"
                />
                {errors.trade_name ? <small className="field-error">{errors.trade_name}</small> : null}
              </label>

              <label>
                <span>Razão social</span>
                <input value={settings.legal_name} onChange={(e) => update("legal_name", e.target.value)} />
              </label>

              <label>
                <span>CPF/CNPJ</span>
                <input inputMode="numeric" value={settings.document} onChange={(e) => update("document", e.target.value)} />
              </label>

              <label>
                <span>E-mail</span>
                <input type="email" value={settings.email} onChange={(e) => update("email", e.target.value)} />
                {errors.email ? <small className="field-error">{errors.email}</small> : null}
              </label>

              <label>
                <span>Telefone</span>
                <input inputMode="tel" value={settings.phone} onChange={(e) => update("phone", e.target.value)} />
              </label>

              <label>
                <span>WhatsApp</span>
                <input inputMode="tel" value={settings.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
              </label>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Endereço"
            description="Opcional. Será usado quando você decidir exibir endereço no documento."
          >
            <div className="form-grid settings-form-grid">
              <label>
                <span>CEP</span>
                <input inputMode="numeric" value={settings.postal_code} onChange={(e) => update("postal_code", e.target.value)} />
              </label>

              <label className="settings-wide">
                <span>Rua / Avenida</span>
                <input value={settings.street} onChange={(e) => update("street", e.target.value)} />
              </label>

              <label>
                <span>Número</span>
                <input value={settings.address_number} onChange={(e) => update("address_number", e.target.value)} />
              </label>

              <label>
                <span>Complemento</span>
                <input value={settings.complement} onChange={(e) => update("complement", e.target.value)} />
              </label>

              <label>
                <span>Bairro</span>
                <input value={settings.district} onChange={(e) => update("district", e.target.value)} />
              </label>

              <label>
                <span>Cidade</span>
                <input value={settings.city} onChange={(e) => update("city", e.target.value)} />
              </label>

              <label>
                <span>UF</span>
                <input maxLength={2} value={settings.state} onChange={(e) => update("state", e.target.value.toUpperCase())} />
              </label>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Identidade do orçamento"
            description="Logo e cor principal serão reaproveitadas automaticamente no PDF."
          >
            <LogoUploader
              logoUrl={logoUrl}
              busy={logoBusy}
              onUpload={uploadLogo}
              onRemove={removeLogo}
            />

            <div className="brand-color-row">
              <label>
                <span>Cor principal</span>
                <div className="color-input-wrap">
                  <input
                    className="color-picker"
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => update("primary_color", e.target.value.toUpperCase())}
                  />
                  <input
                    className="color-text"
                    value={settings.primary_color}
                    maxLength={7}
                    onChange={(e) => update("primary_color", e.target.value.toUpperCase())}
                  />
                </div>
                {errors.primary_color ? <small className="field-error">{errors.primary_color}</small> : null}
              </label>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Padrões para novos orçamentos"
            description="Esses valores entram automaticamente. Você poderá alterar cada orçamento individualmente."
          >
            <div className="form-grid settings-form-grid">
              <label>
                <span>Validade padrão</span>
                <div className="suffix-input">
                  <input
                    min="1"
                    max="365"
                    type="number"
                    inputMode="numeric"
                    value={settings.default_quote_validity_days}
                    onChange={(e) => update("default_quote_validity_days", e.target.value)}
                  />
                  <span>dias</span>
                </div>
              </label>

              <label>
                <span>Prazo de entrega padrão</span>
                <div className="suffix-input">
                  <input
                    min="0"
                    max="365"
                    type="number"
                    inputMode="numeric"
                    value={settings.default_delivery_days}
                    onChange={(e) => update("default_delivery_days", e.target.value)}
                  />
                  <span>dias</span>
                </div>
                <small>Use 0 para não preencher a data automaticamente.</small>
              </label>

              <label className="full-span">
                <span>Condição de pagamento padrão</span>
                <input
                  value={settings.default_payment_terms}
                  onChange={(e) => update("default_payment_terms", e.target.value)}
                  placeholder="Ex.: 50% na entrada e 50% na entrega"
                />
              </label>

              <label className="full-span">
                <span>Mensagem padrão</span>
                <textarea
                  rows="3"
                  value={settings.default_quote_message}
                  onChange={(e) => update("default_quote_message", e.target.value)}
                  placeholder="Ex.: Obrigado pela oportunidade de apresentar esta proposta."
                />
              </label>

              <label className="full-span">
                <span>Observações padrão</span>
                <textarea
                  rows="3"
                  value={settings.default_quote_notes}
                  onChange={(e) => update("default_quote_notes", e.target.value)}
                />
              </label>

              <label className="full-span">
                <span>Termos do orçamento</span>
                <textarea
                  rows="5"
                  value={settings.default_quote_terms}
                  onChange={(e) => update("default_quote_terms", e.target.value)}
                  placeholder="Prazo, condições, responsabilidades e outras informações."
                />
              </label>
            </div>
          </SettingsSection>

          <div className="settings-mobile-save">
            <button className="primary-button full" disabled={saving || !dirty} type="submit">
              <Save size={17} />
              {saving ? "Salvando..." : dirty ? "Salvar alterações" : "Tudo salvo"}
            </button>
          </div>
        </div>

        <aside className="settings-preview-column">
          <div className="settings-preview-sticky">
            <div className="preview-heading">
              <span>PRÉVIA</span>
              <strong>Identidade do PDF</strong>
              <p>Esta é uma prévia simplificada. O PDF definitivo será construído na fase própria.</p>
            </div>
            <PdfBrandPreview settings={settings} logoUrl={logoUrl} />
            <div className="automation-note">
              <strong>Automação preparada</strong>
              <p>Validade, entrega, pagamento, mensagens e termos já estão prontos para preencher novos orçamentos automaticamente.</p>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}
