import {
  AlertCircle,
  BellRing,
  Clock3,
  FileText,
  Heart,
  MessageCircle,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  defaultAutomationSettings,
  deleteQuoteTemplate,
  emptyAutomationSuggestions,
  getAutomationSettings,
  getAutomationSuggestions,
  listQuoteTemplates,
  renderAutomationMessage,
  saveAutomationSettings,
  saveQuoteTemplate,
  toggleTemplateFavorite,
} from "../services/automationService";

function friendlyAutomationError(error) {
  const raw = error instanceof Error ? error.message : String(error || "");
  const lower = raw.toLowerCase();

  if (
    lower.includes("permission denied") ||
    lower.includes("automation_settings") ||
    lower.includes("quote_templates") ||
    lower.includes("does not exist") ||
    lower.includes("schema cache")
  ) {
    return "A estrutura de Automações no Supabase ainda precisa ser atualizada. Aguarde o workflow “Atualizar Supabase em produção” ficar verde e tente novamente.";
  }

  return raw || "Não foi possível carregar as automações.";
}

export default function Automations() {
  const { workspace } = useAuth();
  const [settings, setSettings] = useState(null);
  const [suggestions, setSuggestions] = useState(emptyAutomationSuggestions());
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    if (!workspace?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadFailed(false);
    setMessage({ type: "", text: "" });

    try {
      const loadedSettings = await getAutomationSettings(workspace.id);
      setSettings(loadedSettings);

      const [loadedSuggestions, loadedTemplates] = await Promise.all([
        getAutomationSuggestions(workspace.id, loadedSettings),
        listQuoteTemplates(workspace.id),
      ]);

      setSuggestions(loadedSuggestions);
      setTemplates(loadedTemplates);
    } catch (error) {
      // Important: always leave loading state, even when Supabase is not ready.
      setSettings((current) => current || defaultAutomationSettings(workspace.id));
      setSuggestions(emptyAutomationSuggestions());
      setTemplates([]);
      setLoadFailed(true);
      setMessage({
        type: "error",
        text: friendlyAutomationError(error),
      });
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSettings() {
    if (!workspace?.id || !settings) return;

    try {
      const saved = await saveAutomationSettings(workspace.id, settings);
      setSettings(saved);
      setSuggestions(await getAutomationSuggestions(workspace.id, saved));
      setLoadFailed(false);
      setMessage({ type: "success", text: "Automações salvas." });
    } catch (error) {
      setMessage({ type: "error", text: friendlyAutomationError(error) });
    }
  }

  async function addTemplate() {
    if (!workspace?.id || !name.trim()) return;

    try {
      await saveQuoteTemplate(workspace.id, {
        name: name.trim(),
        description: "Modelo rápido",
        payload_json: {},
        is_favorite: false,
      });

      setName("");
      setTemplates(await listQuoteTemplates(workspace.id));
      setMessage({ type: "success", text: "Modelo criado." });
    } catch (error) {
      setMessage({ type: "error", text: friendlyAutomationError(error) });
    }
  }

  async function favorite(template) {
    try {
      await toggleTemplateFavorite(workspace.id, template);
      setTemplates(await listQuoteTemplates(workspace.id));
    } catch (error) {
      setMessage({ type: "error", text: friendlyAutomationError(error) });
    }
  }

  async function remove(template) {
    if (!window.confirm(`Excluir o modelo "${template.name}"?`)) return;

    try {
      await deleteQuoteTemplate(workspace.id, template.id);
      setTemplates(await listQuoteTemplates(workspace.id));
    } catch (error) {
      setMessage({ type: "error", text: friendlyAutomationError(error) });
    }
  }

  function whatsappLink(item) {
    const raw =
      item.client_snapshot_json?.whatsapp ||
      item.client_snapshot_json?.phone ||
      "";
    const phone = String(raw).replace(/\D/g, "");

    if (!phone) return "#";

    return `https://wa.me/${phone}?text=${encodeURIComponent(
      renderAutomationMessage(settings?.default_whatsapp_message, item),
    )}`;
  }

  if (loading) {
    return (
      <section className="automation-loading">
        <div className="spinner" />
        <strong>Preparando automações...</strong>
      </section>
    );
  }

  if (!workspace?.id) {
    return (
      <section className="automation-error-state">
        <AlertCircle size={28} />
        <strong>Espaço de trabalho não encontrado</strong>
        <span>Recarregue o app ou entre novamente.</span>
      </section>
    );
  }

  const safeSettings = settings || defaultAutomationSettings(workspace.id);

  const cards = [
    [
      "Retornos sugeridos",
      suggestions.followups || [],
      BellRing,
      "Orçamentos aguardando resposta há tempo suficiente para um retorno.",
    ],
    [
      "Validade próxima",
      suggestions.expiring || [],
      Clock3,
      "Orçamentos próximos do vencimento.",
    ],
    [
      "Entregas prioritárias",
      suggestions.deliveries || [],
      Sparkles,
      "Serviços vencidos ou próximos da entrega.",
    ],
  ];

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AUTOMAÇÕES</p>
          <h1>Assistente do dia a dia</h1>
          <p>
            Reduza tarefas repetitivas sem executar ações importantes sem sua
            confirmação.
          </p>
        </div>
      </div>

      {message.text ? (
        <div className={`form-alert ${message.type} automation-main-alert`}>
          <span>{message.text}</span>
          {loadFailed ? (
            <button type="button" onClick={load}>
              <RefreshCw size={15} /> Tentar novamente
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={`automation-content ${loadFailed ? "database-pending" : ""}`}>
        <div className="automation-settings">
          <div>
            <strong>Lembretes inteligentes</strong>
            <span>Você decide os prazos usados nas sugestões.</span>
          </div>

          <label>
            Retorno após
            <input
              type="number"
              min="1"
              max="30"
              value={safeSettings.quote_followup_days}
              onChange={(e) =>
                setSettings({
                  ...safeSettings,
                  quote_followup_days: Number(e.target.value),
                })
              }
            />
            <small>dias</small>
          </label>

          <label>
            Validade
            <input
              type="number"
              min="0"
              max="15"
              value={safeSettings.quote_expiry_warning_days}
              onChange={(e) =>
                setSettings({
                  ...safeSettings,
                  quote_expiry_warning_days: Number(e.target.value),
                })
              }
            />
            <small>dias antes</small>
          </label>

          <label>
            Entrega
            <input
              type="number"
              min="0"
              max="15"
              value={safeSettings.delivery_warning_days}
              onChange={(e) =>
                setSettings({
                  ...safeSettings,
                  delivery_warning_days: Number(e.target.value),
                })
              }
            />
            <small>dias antes</small>
          </label>

          <button className="primary-button" type="button" onClick={saveSettings}>
            <Save size={16} /> Salvar
          </button>
        </div>

        <div className="automation-grid">
          {cards.map(([title, items, Icon, description]) => (
            <section className="automation-card" key={title}>
              <header>
                <span>
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </div>
                <b>{items.length}</b>
              </header>

              <div className="automation-list">
                {items.length ? (
                  items.slice(0, 5).map((item) => (
                    <div className="automation-row" key={item.id}>
                      <div>
                        <strong>
                          #{String(item.quote_number || "").padStart(4, "0")} ·{" "}
                          {item.client_snapshot_json?.name || "Cliente"}
                        </strong>
                        <span>
                          {item.due_date
                            ? `Entrega ${new Date(
                                `${item.due_date}T12:00:00`,
                              ).toLocaleDateString("pt-BR")}`
                            : item.valid_until
                              ? `Válido até ${new Date(
                                  `${item.valid_until}T12:00:00`,
                                ).toLocaleDateString("pt-BR")}`
                              : "Aguardando retorno"}
                        </span>
                      </div>

                      <div className="automation-row-actions">
                        {item.client_snapshot_json?.whatsapp ||
                        item.client_snapshot_json?.phone ? (
                          <a
                            href={whatsappLink(item)}
                            target="_blank"
                            rel="noreferrer"
                            title="Mensagem sugerida"
                          >
                            <MessageCircle size={15} />
                          </a>
                        ) : null}

                        <Link to={`/orcamentos/${item.quote_id || item.id}`}>
                          <FileText size={15} />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="automation-empty">Nada para agir agora.</div>
                )}
              </div>
            </section>
          ))}
        </div>

        <section className="automation-message">
          <div>
            <strong>Mensagem padrão de acompanhamento</strong>
            <span>
              Use <code>{"{cliente}"}</code> e <code>{"{numero}"}</code>. A
              mensagem só abre após você clicar.
            </span>
          </div>

          <textarea
            rows="3"
            value={safeSettings.default_whatsapp_message}
            onChange={(e) =>
              setSettings({
                ...safeSettings,
                default_whatsapp_message: e.target.value,
              })
            }
          />

          <button
            className="secondary-button"
            type="button"
            onClick={saveSettings}
          >
            <Save size={15} /> Salvar mensagem
          </button>
        </section>

        <div className="automation-bottom-grid">
          <section className="automation-section">
            <header>
              <div>
                <strong>Recentes</strong>
                <span>Continue de onde parou.</span>
              </div>
            </header>

            <div className="automation-list">
              {(suggestions.recent || []).length ? (
                suggestions.recent.map((quote) => (
                  <Link
                    className="automation-recent"
                    to={`/orcamentos/${quote.id}`}
                    key={quote.id}
                  >
                    <FileText size={15} />
                    <span>
                      <strong>
                        #{String(quote.quote_number).padStart(4, "0")} ·{" "}
                        {quote.client_snapshot_json?.name || "Cliente"}
                      </strong>
                      <small>{quote.status}</small>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="automation-empty">Nenhum orçamento recente.</div>
              )}
            </div>
          </section>

          <section className="automation-section">
            <header>
              <div>
                <strong>Favoritos e modelos</strong>
                <span>Atalhos para trabalhos recorrentes.</span>
              </div>
            </header>

            <div className="template-create">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do novo modelo"
              />
              <button type="button" onClick={addTemplate}>
                Adicionar
              </button>
            </div>

            <div className="automation-list">
              {templates.length ? (
                templates.map((template) => (
                  <div className="template-row" key={template.id}>
                    <span>
                      <strong>{template.name}</strong>
                      <small>{template.description || "Modelo rápido"}</small>
                    </span>

                    <button
                      type="button"
                      className={template.is_favorite ? "favorite" : ""}
                      onClick={() => favorite(template)}
                      title="Favorito"
                    >
                      <Heart size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(template)}
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="automation-empty">Nenhum modelo salvo ainda.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
