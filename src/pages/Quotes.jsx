import { FileText, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import QuoteManagementCard from "../components/quotes/QuoteManagementCard";
import { useAuth } from "../contexts/AuthContext";
import { QUOTE_FILTERS } from "../lib/quote";
import {
  approveQuote,
  cancelQuote,
  duplicateQuote,
  listQuotes,
  reopenQuote,
} from "../services/quoteService";

export default function Quotes() {
  const [searchParams] = useSearchParams();
  const { workspace } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      setQuotes(await listQuotes(workspace.id, {
        status,
        search: debouncedSearch,
        limit: 200,
      }));
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível carregar os orçamentos.",
      });
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, status, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const duplicate = async (quote) => {
    if (!window.confirm(`Duplicar o orçamento #${String(quote.quote_number).padStart(4, "0")}?`)) return;

    setBusyId(quote.id);
    try {
      const newId = await duplicateQuote(workspace.id, quote.id);
      navigate(`/orcamentos/${newId}`);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível duplicar.",
      });
    } finally {
      setBusyId("");
    }
  };

  const cancel = async (quote) => {
    const reason = window.prompt("Motivo do cancelamento (opcional):", "");
    if (reason === null) return;

    if (!window.confirm("Cancelar este orçamento? Ele continuará no histórico.")) return;

    setBusyId(quote.id);
    try {
      await cancelQuote(workspace.id, quote.id, reason);
      setMessage({ type: "success", text: "Orçamento cancelado e mantido no histórico." });
      await load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível cancelar.",
      });
    } finally {
      setBusyId("");
    }
  };


  const approve = async (quote) => {
    if (!window.confirm(
      `Aprovar o orçamento #${String(quote.quote_number).padStart(4, "0")}?\n\n` +
      "Ele será bloqueado para edição e entrará automaticamente em A Fazer."
    )) return;

    setBusyId(quote.id);

    try {
      await approveQuote(workspace.id, quote.id);
      setMessage({
        type: "success",
        text: "Orçamento aprovado. O serviço foi criado automaticamente em A Fazer.",
      });
      await load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível aprovar o orçamento.",
      });
    } finally {
      setBusyId("");
    }
  };

  const reopen = async (quote) => {
    if (!window.confirm("Reabrir este orçamento cancelado como rascunho?")) return;

    setBusyId(quote.id);
    try {
      await reopenQuote(workspace.id, quote.id);
      setMessage({ type: "success", text: "Orçamento reaberto como rascunho." });
      await load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível reabrir.",
      });
    } finally {
      setBusyId("");
    }
  };

  return (
    <section>
      <div className="page-heading quotes-page-heading">
        <div>
          <p className="eyebrow">ORÇAMENTOS</p>
          <h1>Orçamentos</h1>
          <p>Encontre rapidamente o que está em andamento e mantenha o histórico organizado.</p>
        </div>
        <Link className="primary-button" to="/orcamentos/novo">
          <Plus size={19} /> Novo orçamento
        </Link>
      </div>

      <div className="quote-management-toolbar">
        <div className="quote-management-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, documento ou número..."
          />
        </div>

        <div className="quote-status-filters">
          {QUOTE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              className={status === filter.value ? "active" : ""}
              type="button"
              onClick={() => setStatus(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {message.text ? (
        <div className={`form-alert ${message.type} quotes-page-message`}>{message.text}</div>
      ) : null}

      {loading ? (
        <div className="quotes-empty">
          <div className="spinner" />
          <strong>Carregando orçamentos...</strong>
        </div>
      ) : quotes.length ? (
        <div className={`quote-management-list ${busyId ? "busy" : ""}`}>
          {quotes.map((quote) => (
            <QuoteManagementCard
              key={quote.id}
              quote={quote}
              onDuplicate={duplicate}
              onCancel={cancel}
              onReopen={reopen}
              onApprove={approve}
            />
          ))}
        </div>
      ) : (
        <div className="quotes-empty">
          <div className="quotes-empty-icon"><FileText size={30} /></div>
          <strong>{search || status !== "all" ? "Nenhum orçamento encontrado" : "Nenhum orçamento ainda"}</strong>
          <p>
            {search || status !== "all"
              ? "Tente alterar a busca ou o filtro."
              : "Crie o primeiro orçamento e acompanhe todo o histórico por aqui."}
          </p>
          {!search && status === "all" ? (
            <Link className="primary-button" to="/orcamentos/novo">
              <Plus size={18} /> Criar orçamento
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
