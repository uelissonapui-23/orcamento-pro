import { CalendarClock, CheckCircle2, FileText, PackageCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatBRL } from "../lib/money";
import { workOrderStatusLabel, workOrderTitle } from "../lib/workOrder";
import { listWorkOrders } from "../services/workOrderService";

function dateLabel(value) {
  if (!value) return "Sem prazo definido";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function WorkOrders() {
  const { workspace } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setError("");

    try {
      setOrders(await listWorkOrders(workspace.id, { status: "open" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar A Fazer.");
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PRODUÇÃO</p>
          <h1>A Fazer</h1>
          <p>Serviços aprovados que ainda precisam ser produzidos ou entregues.</p>
        </div>
      </div>

      <div className="phase13-note">
        <CheckCircle2 size={18} />
        <div>
          <strong>Aprovação automática ativa</strong>
          <span>A operação diária completa desta tela será concluída na Fase 14.</span>
        </div>
      </div>

      {error ? <div className="form-alert error">{error}</div> : null}

      {loading ? (
        <div className="work-orders-empty">
          <div className="spinner" />
          <strong>Carregando serviços...</strong>
        </div>
      ) : orders.length ? (
        <div className="work-orders-list">
          {orders.map((order) => (
            <article className="work-order-card" key={order.id}>
              <div className="work-order-icon">
                <PackageCheck size={20} />
              </div>

              <div className="work-order-main">
                <div className="work-order-title">
                  <strong>{workOrderTitle(order)}</strong>
                  <span className={`work-order-status ${order.status}`}>
                    {workOrderStatusLabel(order.status)}
                  </span>
                </div>
                <span>
                  {order.items_snapshot_json.length} item(ns)
                  {order.approved_at
                    ? ` · aprovado em ${new Date(order.approved_at).toLocaleDateString("pt-BR")}`
                    : ""}
                </span>
              </div>

              <div className="work-order-due">
                <small><CalendarClock size={13} /> Prazo</small>
                <strong>{dateLabel(order.due_date)}</strong>
              </div>

              <div className="work-order-total">
                <small>Valor</small>
                <strong>{formatBRL(order.total)}</strong>
              </div>

              <Link className="quote-icon-button" to={`/orcamentos/${order.quote_id}/pdf`} title="Ver orçamento">
                <FileText size={16} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="work-orders-empty">
          <div className="work-orders-empty-icon"><PackageCheck size={30} /></div>
          <strong>Nenhum serviço em A Fazer</strong>
          <p>Quando um orçamento em “Aguardando resposta” for aprovado, ele aparecerá aqui automaticamente.</p>
          <Link className="secondary-button" to="/orcamentos">Ir para Orçamentos</Link>
        </div>
      )}
    </section>
  );
}
