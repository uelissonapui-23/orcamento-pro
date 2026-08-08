import {
  Ban,
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatBRL } from "../../lib/money";
import {
  quoteCanCancel,
  quoteCanDuplicate,
  quoteCanEdit,
  quoteNumberLabel,
  quoteStatusLabel,
} from "../../lib/quote";

export default function QuoteManagementCard({
  quote,
  onDuplicate,
  onCancel,
  onReopen,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const clientName = quote.client_snapshot_json?.name || "Cliente";
  const issue = quote.issue_date
    ? new Date(`${quote.issue_date}T12:00:00`).toLocaleDateString("pt-BR")
    : "—";
  const valid = quote.valid_until
    ? new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString("pt-BR")
    : "—";

  return (
    <article className={`quote-management-card ${quote.status}`}>
      <div className="quote-management-main">
        <div className="quote-management-topline">
          <strong>{quoteNumberLabel(quote.quote_number)} · {clientName}</strong>
          <span className={`quote-status ${quote.status}`}>{quoteStatusLabel(quote.status)}</span>
        </div>
        <span>Emitido em {issue} · válido até {valid}</span>
      </div>

      <div className="quote-management-total">
        <small>Total</small>
        <strong>{formatBRL(quote.total)}</strong>
      </div>

      <div className="quote-management-actions">
        <Link className="quote-icon-button" to={`/orcamentos/${quote.id}/pdf`} title="PDF">
          <Download size={16} />
        </Link>

        {quoteCanEdit(quote.status) ? (
          <Link className="quote-icon-button" to={`/orcamentos/${quote.id}`} title="Editar">
            <Pencil size={16} />
          </Link>
        ) : null}

        <div className="quote-menu-wrap">
          <button
            className="quote-icon-button"
            type="button"
            aria-label="Mais ações"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <MoreHorizontal size={17} />
          </button>

          {menuOpen ? (
            <div className="quote-action-menu">
              {quoteCanDuplicate(quote.status) ? (
                <button type="button" onClick={() => { setMenuOpen(false); onDuplicate(quote); }}>
                  <Copy size={15} /> Duplicar
                </button>
              ) : null}

              {quoteCanCancel(quote.status) ? (
                <button className="danger" type="button" onClick={() => { setMenuOpen(false); onCancel(quote); }}>
                  <Ban size={15} /> Cancelar
                </button>
              ) : null}

              {quote.status === "cancelled" ? (
                <button type="button" onClick={() => { setMenuOpen(false); onReopen(quote); }}>
                  <RotateCcw size={15} /> Reabrir como rascunho
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
