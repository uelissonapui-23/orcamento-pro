import { Copy, FileText, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBRL } from "../../lib/money";
import { workOrderTitle } from "../../lib/workOrder";

function deliveredDate(order) {
  if (!order.delivered_at) return "—";
  return new Date(order.delivered_at).toLocaleDateString("pt-BR");
}

export default function DeliveredCard({ order, onDuplicate }) {
  return (
    <article className="delivered-card">
      <div className="delivered-icon">
        <PackageCheck size={20} />
      </div>

      <div className="delivered-main">
        <div className="delivered-title-line">
          <strong>{workOrderTitle(order)}</strong>
          <span className="delivered-pill">Entregue</span>
        </div>

        <span>
          Entregue em {deliveredDate(order)}
          {order.items_snapshot_json?.length
            ? ` · ${order.items_snapshot_json.length} item(ns)`
            : ""}
        </span>

        {order.delivery_notes ? (
          <small>{order.delivery_notes}</small>
        ) : null}
      </div>

      <div className="delivered-total">
        <small>Valor</small>
        <strong>{formatBRL(order.total)}</strong>
      </div>

      <div className="delivered-actions">
        <Link className="quote-icon-button" to={`/orcamentos/${order.quote_id}/pdf`} title="PDF">
          <FileText size={16} />
        </Link>

        <button
          className="quote-icon-button"
          type="button"
          title="Duplicar orçamento"
          onClick={() => onDuplicate(order)}
        >
          <Copy size={16} />
        </button>
      </div>
    </article>
  );
}
