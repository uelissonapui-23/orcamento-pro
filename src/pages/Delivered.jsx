import { PackageCheck, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeliveredCard from "../components/delivered/DeliveredCard";
import DeliveredDetailsDialog from "../components/delivered/DeliveredDetailsDialog";
import { useAuth } from "../contexts/AuthContext";
import { duplicateQuote } from "../services/quoteService";
import { listDeliveredWorkOrders } from "../services/workOrderService";

export default function Delivered() {
  const { workspace } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      setOrders(await listDeliveredWorkOrders(workspace.id, {
        search: debouncedSearch,
        dateFrom,
        dateTo,
      }));
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível carregar os entregues.",
      });
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, debouncedSearch, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const duplicate = async (order) => {
    if (!window.confirm(
      `Duplicar o orçamento #${String(order.quote_number).padStart(4, "0")} para criar um novo trabalho?`
    )) return;

    setBusyId(order.id);

    try {
      const newId = await duplicateQuote(workspace.id, order.quote_id);
      navigate(`/orcamentos/${newId}`);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível duplicar o orçamento.",
      });
    } finally {
      setBusyId("");
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">HISTÓRICO</p>
          <h1>Entregues</h1>
          <p>Consulte trabalhos concluídos sem misturar com a operação diária.</p>
        </div>
      </div>

      <div className="delivered-toolbar">
        <div className="delivered-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, número, documento ou observação..."
          />
        </div>

        <label>
          <span>De</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>

        <label>
          <span>Até</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>

      {message.text ? (
        <div className={`form-alert ${message.type}`}>{message.text}</div>
      ) : null}

      {loading ? (
        <div className="delivered-empty">
          <div className="spinner" />
          <strong>Carregando entregues...</strong>
        </div>
      ) : orders.length ? (
        <div className={`delivered-list ${busyId ? "busy" : ""}`}>
          {orders.map((order) => (
            <div key={order.id} onDoubleClick={() => setSelected(order)}>
              <DeliveredCard order={order} onDuplicate={duplicate} />
              <button className="delivered-details-link" type="button" onClick={() => setSelected(order)}>
                Ver detalhes
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="delivered-empty">
          <div className="delivered-empty-icon"><PackageCheck size={30} /></div>
          <strong>Nenhum serviço entregue neste período</strong>
          <p>Quando um serviço for marcado como entregue em A Fazer, ele aparecerá aqui.</p>
        </div>
      )}

      <DeliveredDetailsDialog
        open={Boolean(selected)}
        order={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
