import { ArrowLeft, Check, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AddQuoteItemDialog from "../components/quotes/AddQuoteItemDialog";
import QuoteItemsEditor from "../components/quotes/QuoteItemsEditor";
import QuoteTotals from "../components/quotes/QuoteTotals";
import QuickClientDialog from "../components/clients/QuickClientDialog";
import { useAuth } from "../contexts/AuthContext";
import { addDaysToIsoDate, buildQuoteDefaults, quoteDeliveryDays } from "../lib/quoteDefaults";
import { buildBusinessSnapshot } from "../lib/quotePdf";
import {
  buildQuoteClientSnapshot,
  createEmptyQuote,
  normalizeQuoteItem,
  quoteNumberLabel,
  validateQuote,
} from "../lib/quote";
import { calculateQuoteTotals } from "../services/pricingService";
import { loadBusinessSettings } from "../services/businessSettingsService";
import { listClients } from "../services/clientService";
import { listProducts } from "../services/productService";
import { listMaterials } from "../services/materialService";
import { getQuote, saveQuote } from "../services/quoteService";

export default function QuoteEditor() {
  const { workspace } = useAuth();
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [itemDialog, setItemDialog] = useState(false);
  const [quickClient, setQuickClient] = useState(false);

  const loadDependencies = useCallback(async () => {
    if (!workspace?.id) return;

    setLoading(true);
    setError("");

    try {
      const [nextClients, nextProducts, nextMaterials, settings] = await Promise.all([
        listClients(workspace.id, { status: "active", limit: 250 }),
        listProducts(workspace.id, { status: "active" }),
        listMaterials(workspace.id, { status: "active" }),
        loadBusinessSettings(workspace.id),
      ]);

      setClients(nextClients);
      setProducts(nextProducts);
      setMaterials(nextMaterials);

      if (quoteId) {
        setQuote(await getQuote(workspace.id, quoteId));
      } else {
        setQuote({
          ...createEmptyQuote(buildQuoteDefaults(settings)),
          business_snapshot_json: buildBusinessSnapshot(settings),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível preparar o orçamento.");
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, quoteId]);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  const totals = useMemo(() => {
    if (!quote) return null;

    try {
      return calculateQuoteTotals({
        items: quote.items || [],
        discountType: quote.discount_type,
        discountValue: quote.discount_value,
        surchargeValue: quote.surcharge_value,
      });
    } catch {
      return {
        subtotal: 0,
        discount_total: 0,
        surcharge_total: 0,
        total: 0,
      };
    }
  }, [quote]);

  if (loading) {
    return <section className="quote-editor-loading"><div className="spinner" /><strong>Preparando orçamento...</strong></section>;
  }

  if (!quote) {
    return <section><div className="form-alert error">{error || "Orçamento não encontrado."}</div></section>;
  }

  const update = (field, value) => {
    setQuote((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const updateIssueDate = (value) => {
    const deliveryDays = quoteDeliveryDays(quote);
    setQuote((current) => ({
      ...current,
      issue_date: value,
      expected_delivery_date:
        value && deliveryDays > 0 ? addDaysToIsoDate(value, deliveryDays) : "",
    }));
    setErrors((current) => ({ ...current, issue_date: "" }));
  };

  const updateDeliveryDays = (value) => {
    const days = Math.max(0, Math.min(365, Number(value || 0)));
    update(
      "expected_delivery_date",
      quote.issue_date && days > 0 ? addDaysToIsoDate(quote.issue_date, days) : "",
    );
  };

  const selectClient = (clientId) => {
    const client = clients.find((item) => item.id === clientId);
    setQuote((current) => ({
      ...current,
      client_id: clientId,
      client_snapshot_json: client ? buildQuoteClientSnapshot(client) : {},
    }));
    setErrors((current) => ({ ...current, client_id: "" }));
  };

  const persist = async (status) => {
    const next = {
      ...quote,
      status,
      subtotal: totals?.subtotal || 0,
      discount_total: totals?.discount_total || 0,
      surcharge_total: totals?.surcharge_total || 0,
      total: totals?.total || 0,
    };
    const validation = validateQuote(next);
    setErrors(validation.errors);

    if (!validation.valid) return;

    setBusy(true);
    setError("");

    try {
      const saved = await saveQuote(workspace.id, next);
      setQuote(saved);
      navigate(`/orcamentos/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o orçamento.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="quote-editor-page">
      <div className="quote-editor-top">
        <div>
          <Link className="quote-back-link" to="/orcamentos"><ArrowLeft size={16} /> Orçamentos</Link>
          <div className="quote-title-line">
            <h1>{quote.id ? `Orçamento ${quoteNumberLabel(quote.quote_number)}` : "Novo orçamento"}</h1>
            <span className={`quote-status ${quote.status}`}>{quote.status === "draft" ? "Rascunho" : "Aguardando resposta"}</span>
          </div>
          <p>Monte o orçamento. Os cálculos e snapshots ficam preservados automaticamente.</p>
        </div>

        <div className="quote-editor-actions">
          {quote.id ? <Link className="secondary-button" to={`/orcamentos/${quote.id}/pdf`}>Ver PDF</Link> : null}
          <button className="secondary-button" type="button" disabled={busy} onClick={() => persist("draft")}>
            <Save size={17} /> Salvar rascunho
          </button>
          <button className="primary-button" type="button" disabled={busy} onClick={() => persist("awaiting_response")}>
            <Check size={17} /> Salvar e finalizar
          </button>
        </div>
      </div>

      {error ? <div className="form-alert error quote-page-alert">{error}</div> : null}

      <div className="quote-editor-grid">
        <div className="quote-editor-main">
          <section className="quote-editor-card quote-basics-card">
            <div className="quote-card-heading">
              <div><h2>Cliente e datas</h2><p>As configurações padrão já foram preenchidas.</p></div>
            </div>

            <div className="quote-basic-fields">
              <label className="quote-client-field">
                <span>Cliente *</span>
                <div className="quote-client-select">
                  <select value={quote.client_id} onChange={(e) => selectClient(e.target.value)}>
                    <option value="">Escolha o cliente...</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                  <button className="secondary-button" type="button" onClick={() => setQuickClient(true)}>+ Cliente rápido</button>
                </div>
                {errors.client_id ? <small className="field-error">{errors.client_id}</small> : null}
              </label>

              <label><span>Data</span><input type="date" value={quote.issue_date} onChange={(e) => updateIssueDate(e.target.value)} />{errors.issue_date ? <small className="field-error">{errors.issue_date}</small> : null}</label>
              <label><span>Validade</span><input type="date" value={quote.valid_until} onChange={(e) => update("valid_until", e.target.value)} />{errors.valid_until ? <small className="field-error">{errors.valid_until}</small> : null}</label>
              <label>
                <span>Prazo de entrega (dias)</span>
                <input
                  type="number"
                  min="0"
                  max="365"
                  inputMode="numeric"
                  value={quoteDeliveryDays(quote) || ""}
                  placeholder="Ex.: 7"
                  onChange={(e) => updateDeliveryDays(e.target.value)}
                />
                <small>O prazo começa a contar após a aprovação do orçamento.</small>
              </label>
            </div>
          </section>

          <QuoteItemsEditor
            items={quote.items}
            onAdd={() => setItemDialog(true)}
            onChange={(items) => update("items", items.map(normalizeQuoteItem))}
            error={errors.items}
          />

          <section className="quote-editor-card">
            <div className="quote-card-heading">
              <div><h2>Condições e observações</h2><p>Esses textos seguem para o PDF definitivo.</p></div>
            </div>
            <div className="quote-text-fields">
              <label><span>Condição de pagamento</span><textarea rows="2" value={quote.payment_terms_snapshot} onChange={(e) => update("payment_terms_snapshot", e.target.value)} /></label>
              <label><span>Mensagem ao cliente</span><textarea rows="3" value={quote.message_snapshot} onChange={(e) => update("message_snapshot", e.target.value)} /></label>
              <label><span>Observação interna/do orçamento</span><textarea rows="3" value={quote.notes_snapshot} onChange={(e) => update("notes_snapshot", e.target.value)} /></label>
              <label><span>Termos</span><textarea rows="4" value={quote.terms_snapshot} onChange={(e) => update("terms_snapshot", e.target.value)} /></label>
            </div>
          </section>
        </div>

        <aside className="quote-editor-side">
          <QuoteTotals quote={{ ...quote, ...(totals || {}) }} onChange={update} />
          <div className="quote-save-hint">
            <strong>Histórico protegido</strong>
            <p>Cliente, cálculos, produtos, materiais, veículo e peças são salvos em snapshots. Alterações futuras nos cadastros não mudam este orçamento.</p>
          </div>
        </aside>
      </div>

      <AddQuoteItemDialog
        open={itemDialog}
        workspaceId={workspace.id}
        products={products}
        materials={materials}
        onClose={() => setItemDialog(false)}
        onAdd={(item) => update("items", [...quote.items, normalizeQuoteItem(item, quote.items.length)])}
      />

      <QuickClientDialog
        open={quickClient}
        workspaceId={workspace.id}
        onClose={() => setQuickClient(false)}
        onSaved={(client) => {
          setClients((current) => [...current, client].sort((a, b) => a.name.localeCompare(b.name)));
          selectClient(client.id);
        }}
      />
    </section>
  );
}
