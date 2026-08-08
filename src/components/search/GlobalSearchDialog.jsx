import {
  Boxes,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  PackageSearch,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  globalSearchPath,
  globalSearchTypeLabel,
} from "../../lib/globalSearch";
import { duplicateMaterial } from "../../services/materialService";
import { duplicateProduct } from "../../services/productService";
import { duplicateQuote } from "../../services/quoteService";
import { globalSearch } from "../../services/globalSearchService";
import { duplicateVehicleModel } from "../../services/vehicleService";

const ICONS = {
  client: UserRound,
  quote: FileText,
  work_order: ClipboardList,
  delivered: CheckCircle2,
  product: Boxes,
  material: PackageSearch,
  vehicle: CarFront,
};

function canDuplicate(result) {
  return ["quote", "work_order", "delivered", "product", "material", "vehicle"].includes(result.type);
}

export default function GlobalSearchDialog({ open, onClose }) {
  const { workspace } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setTerm("");
      setResults([]);
      setError("");
      return;
    }

    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open || !workspace?.id) return;

    const clean = term.trim();
    if (clean.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        setResults(await globalSearch(workspace.id, clean));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível pesquisar.");
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [open, term, workspace?.id]);

  const grouped = useMemo(() => {
    const map = new Map();

    results.forEach((result) => {
      if (!map.has(result.type)) map.set(result.type, []);
      map.get(result.type).push(result);
    });

    return [...map.entries()];
  }, [results]);

  if (!open) return null;

  const openResult = (result) => {
    const path = globalSearchPath(result);
    onClose();

    if (result.search_hint && !["quote", "work_order", "delivered"].includes(result.type)) {
      navigate(`${path}?q=${encodeURIComponent(result.search_hint)}`);
      return;
    }

    navigate(path);
  };

  const duplicate = async (event, result) => {
    event.stopPropagation();
    if (!workspace?.id || !result.duplicate_id) return;

    if (!window.confirm(`Duplicar "${result.title}"? O original não será alterado.`)) return;

    setBusyId(`${result.type}:${result.id}`);
    setError("");

    try {
      let newId = null;

      if (["quote", "work_order", "delivered"].includes(result.type)) {
        newId = await duplicateQuote(workspace.id, result.duplicate_id);
        onClose();
        navigate(`/orcamentos/${newId}`);
        return;
      }

      if (result.type === "product") await duplicateProduct(result.duplicate_id);
      if (result.type === "material") await duplicateMaterial(result.duplicate_id);
      if (result.type === "vehicle") await duplicateVehicleModel(result.duplicate_id);

      setResults((current) => current.filter((item) => item.id !== result.id || item.type !== result.type));
      setError("Cópia criada. Abra o cadastro correspondente para conferir.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível duplicar.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="global-search-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="global-search-dialog" role="dialog" aria-modal="true" aria-label="Busca global">
        <header className="global-search-input-row">
          <Search size={20} />
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar cliente, orçamento, produto, material, veículo..."
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && results[0]) openResult(results[0]);
            }}
          />
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={19} /></button>
        </header>

        <div className="global-search-body">
          {error ? <div className={`global-search-message ${error.startsWith("Cópia criada") ? "success" : "error"}`}>{error}</div> : null}

          {!term.trim() ? (
            <div className="global-search-help">
              <Search size={28} />
              <strong>Encontre qualquer coisa rapidamente</strong>
              <span>Digite pelo menos 2 caracteres. Atalho: Ctrl/Cmd + K.</span>
            </div>
          ) : term.trim().length < 2 ? (
            <div className="global-search-help"><span>Digite mais um caractere para pesquisar.</span></div>
          ) : loading ? (
            <div className="global-search-help"><div className="spinner" /><span>Pesquisando...</span></div>
          ) : grouped.length ? (
            <div className={`global-search-groups ${busyId ? "busy" : ""}`}>
              {grouped.map(([type, items]) => (
                <section className="global-search-group" key={type}>
                  <h3>{globalSearchTypeLabel(type)}</h3>

                  {items.map((result) => {
                    const Icon = ICONS[result.type] || Search;
                    return (
                      <button
                        className="global-search-result"
                        type="button"
                        key={`${result.type}:${result.id}`}
                        onClick={() => openResult(result)}
                      >
                        <span className={`global-search-result-icon ${result.type}`}><Icon size={17} /></span>
                        <span className="global-search-result-copy">
                          <strong>{result.title}</strong>
                          <small>{result.subtitle || globalSearchTypeLabel(result.type)}</small>
                        </span>

                        {canDuplicate(result) ? (
                          <span
                            className="global-search-duplicate"
                            role="button"
                            tabIndex={0}
                            title="Duplicar"
                            onClick={(event) => duplicate(event, result)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") duplicate(event, result);
                            }}
                          >
                            <Copy size={15} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </section>
              ))}
            </div>
          ) : (
            <div className="global-search-help">
              <Search size={26} />
              <strong>Nenhum resultado</strong>
              <span>Tente nome, número do orçamento, documento, produto ou veículo.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
