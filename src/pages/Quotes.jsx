import { Download, FileText, Pencil, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatBRL } from "../lib/money";
import { quoteNumberLabel, quoteStatusLabel } from "../lib/quote";
import { listQuotes } from "../services/quoteService";

export default function Quotes() {
  const { workspace } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setError("");
    try {
      setQuotes(await listQuotes(workspace.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os orçamentos.");
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">ORÇAMENTOS</p><h1>Orçamentos</h1><p>Crie, continue e acompanhe seus orçamentos.</p></div>
        <Link className="primary-button" to="/orcamentos/novo"><Plus size={19} /> Novo orçamento</Link>
      </div>

      {error ? <div className="form-alert error">{error}</div> : null}

      {loading ? (
        <div className="quotes-empty"><div className="spinner" /><strong>Carregando orçamentos...</strong></div>
      ) : quotes.length ? (
        <div className="quotes-list">
          {quotes.map((quote) => (
            <article className="quote-list-card" key={quote.id}>
              <div className="quote-list-icon"><FileText size={20} /></div>
              <Link className="quote-list-main" to={`/orcamentos/${quote.id}`}>
                <div><strong>{quoteNumberLabel(quote.quote_number)} · {quote.client_snapshot_json?.name || "Cliente"}</strong><span className={`quote-status ${quote.status}`}>{quoteStatusLabel(quote.status)}</span></div>
                <span>Emitido em {quote.issue_date ? new Date(`${quote.issue_date}T12:00:00`).toLocaleDateString("pt-BR") : "—"} · válido até {quote.valid_until ? new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString("pt-BR") : "—"}</span>
              </Link>
              <div className="quote-list-total"><small>Total</small><strong>{formatBRL(quote.total)}</strong></div>
              <div className="quote-list-actions">
                <Link to={`/orcamentos/${quote.id}/pdf`} title="PDF"><Download size={17} /></Link>
                <Link to={`/orcamentos/${quote.id}`} title="Editar"><Pencil size={17} /></Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="quotes-empty">
          <div className="quotes-empty-icon"><FileText size={30} /></div>
          <strong>Nenhum orçamento ainda</strong>
          <p>Crie o primeiro orçamento. Cliente, itens e cálculos ficarão salvos no mesmo fluxo.</p>
          <Link className="primary-button" to="/orcamentos/novo"><Plus size={18} /> Criar orçamento</Link>
        </div>
      )}
    </section>
  );
}
