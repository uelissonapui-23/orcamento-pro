import { CheckCircle2, PackageCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import WorkOrderCard from "../components/workorders/WorkOrderCard";
import { useAuth } from "../contexts/AuthContext";
import {
  deliverWorkOrder,
  listWorkOrders,
  markWorkOrderReady,
  startWorkOrder,
  updateWorkOrderDueDate,
} from "../services/workOrderService";

export default function WorkOrders() {
  const { workspace } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      setOrders(await listWorkOrders(workspace.id, { status: filter, limit: 200 }));
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível carregar A Fazer.",
      });
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, filter]);

  useEffect(() => { load(); }, [load]);

  const run = async (order, action, successMessage) => {
    setBusyId(order.id);
    setMessage({ type: "", text: "" });

    try {
      await action();
      setMessage({ type: "success", text: successMessage });
      await load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Não foi possível atualizar o serviço.",
      });
    } finally {
      setBusyId("");
    }
  };

  const start = (order) => {
    if (!window.confirm("Iniciar a produção deste serviço?")) return;
    run(order, () => startWorkOrder(workspace.id, order.id), "Serviço marcado como Em produção.");
  };

  const ready = (order) => {
    if (!window.confirm("Marcar este serviço como pronto?")) return;
    run(order, () => markWorkOrderReady(workspace.id, order.id), "Serviço marcado como Pronto.");
  };

  const deliver = (order) => {
    const notes = window.prompt("Observação da entrega (opcional):", "");
    if (notes === null) return;
    if (!window.confirm("Confirmar que este serviço foi entregue?")) return;

    run(
      order,
      () => deliverWorkOrder(workspace.id, order.id, notes),
      "Serviço entregue. Ele saiu de A Fazer e foi para Entregues."
    );
  };

  const changeDueDate = (order) => {
    const value = window.prompt(
      "Nova data de entrega (AAAA-MM-DD). Deixe vazio para remover o prazo:",
      order.due_date || ""
    );
    if (value === null) return;

    const clean = value.trim();
    if (clean && !/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      setMessage({ type: "error", text: "Use o formato AAAA-MM-DD." });
      return;
    }

    run(
      order,
      () => updateWorkOrderDueDate(workspace.id, order.id, clean || null),
      "Prazo atualizado."
    );
  };

  return (
    <section>
      <div className="page-heading work-orders-heading">
        <div>
          <p className="eyebrow">PRODUÇÃO</p>
          <h1>A Fazer</h1>
          <p>Priorize o que vence primeiro e acompanhe cada etapa até a entrega.</p>
        </div>
      </div>

      <div className="work-orders-toolbar">
        <div className="work-order-filter">
          {[
            ["open", "Em aberto"],
            ["pending", "A fazer"],
            ["in_progress", "Em produção"],
            ["ready", "Prontos"],
            ["all", "Todos"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="work-order-legend">
          <span className="dot overdue" /> Atrasado
          <span className="dot soon" /> Próximo
        </div>
      </div>

      <div className="phase14-note">
        <CheckCircle2 size={18} />
        <div>
          <strong>Ordem automática por prazo</strong>
          <span>Os serviços com data mais próxima aparecem primeiro.</span>
        </div>
      </div>

      {message.text ? (
        <div className={`form-alert ${message.type}`}>{message.text}</div>
      ) : null}

      {loading ? (
        <div className="work-orders-empty">
          <div className="spinner" />
          <strong>Carregando serviços...</strong>
        </div>
      ) : orders.length ? (
        <div className={`work-orders-list ${busyId ? "busy" : ""}`}>
          {orders.map((order) => (
            <WorkOrderCard
              key={order.id}
              order={order}
              onStart={start}
              onReady={ready}
              onDeliver={deliver}
              onChangeDueDate={changeDueDate}
            />
          ))}
        </div>
      ) : (
        <div className="work-orders-empty">
          <div className="work-orders-empty-icon"><PackageCheck size={30} /></div>
          <strong>Nenhum serviço neste filtro</strong>
          <p>Quando houver serviços aprovados, eles serão organizados automaticamente por prazo.</p>
        </div>
      )}
    </section>
  );
}
