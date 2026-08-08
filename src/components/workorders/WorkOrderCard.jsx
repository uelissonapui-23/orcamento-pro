import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  MessageCircle,
  PackageCheck,
  PlayCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatBRL } from "../../lib/money";
import {
  workOrderCanDeliver,
  workOrderCanReady,
  workOrderCanStart,
  workOrderStatusLabel,
  workOrderTitle,
  workOrderUrgency,
} from "../../lib/workOrder";

function whatsappLink(order) {
  const raw =
    order.client_snapshot_json?.whatsapp ||
    order.client_snapshot_json?.phone ||
    "";
  const phone = String(raw).replace(/\D/g, "");
  if (!phone) return "";

  const message = encodeURIComponent(
    `Olá, ${order.client_snapshot_json?.name || ""}! ` +
    `Sobre o orçamento #${String(order.quote_number || "").padStart(4, "0")}.`
  );

  return `https://wa.me/${phone}?text=${message}`;
}

function dateLabel(value) {
  if (!value) return "Sem prazo";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function WorkOrderCard({
  order,
  onStart,
  onReady,
  onDeliver,
  onChangeDueDate,
}) {
  const urgency = workOrderUrgency(order);
  const wa = whatsappLink(order);

  return (
    <article className={`work-order-card operational ${order.status} urgency-${urgency.level}`}>
      <div className="work-order-icon">
        <PackageCheck size={20} />
      </div>

      <div className="work-order-main">
        <div className="work-order-title">
          <strong>{workOrderTitle(order)}</strong>
          <span className={`work-order-status ${order.status}`}>
            {workOrderStatusLabel(order.status)}
          </span>
          {urgency.level !== "none" && urgency.level !== "normal" ? (
            <span className={`urgency-badge ${urgency.level}`}>{urgency.label}</span>
          ) : null}
        </div>
        <span>
          {order.items_snapshot_json.length} item(ns)
          {order.approved_at
            ? ` · aprovado em ${new Date(order.approved_at).toLocaleDateString("pt-BR")}`
            : ""}
        </span>
      </div>

      <button className="work-order-due editable" type="button" onClick={() => onChangeDueDate(order)}>
        <small><CalendarClock size={13} /> Prazo</small>
        <strong>{dateLabel(order.due_date)}</strong>
      </button>

      <div className="work-order-total">
        <small>Valor</small>
        <strong>{formatBRL(order.total)}</strong>
      </div>

      <div className="work-order-actions">
        {workOrderCanStart(order.status) ? (
          <button className="action primary-soft" type="button" onClick={() => onStart(order)}>
            <PlayCircle size={16} /> Iniciar
          </button>
        ) : null}

        {workOrderCanReady(order.status) ? (
          <button className="action success-soft" type="button" onClick={() => onReady(order)}>
            <CheckCircle2 size={16} /> Marcar pronto
          </button>
        ) : null}

        {workOrderCanDeliver(order.status) ? (
          <button className="action success" type="button" onClick={() => onDeliver(order)}>
            <PackageCheck size={16} /> Entregar
          </button>
        ) : null}

        {wa ? (
          <a className="quote-icon-button" href={wa} target="_blank" rel="noreferrer" title="WhatsApp">
            <MessageCircle size={16} />
          </a>
        ) : null}

        <Link className="quote-icon-button" to={`/orcamentos/${order.quote_id}/pdf`} title="PDF">
          <FileText size={16} />
        </Link>

        <Link className="quote-icon-button" to={`/orcamentos/${order.quote_id}`} title="Orçamento">
          <ExternalLink size={16} />
        </Link>
      </div>
    </article>
  );
}
