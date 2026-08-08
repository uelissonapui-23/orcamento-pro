import { FileText, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBRL } from "../../lib/money";
import { workOrderTitle } from "../../lib/workOrder";

function dateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export default function DeliveredDetailsDialog({ open, order, onClose }) {
  if (!open || !order) return null;

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="delivered-details-dialog" role="dialog" aria-modal="true">
        <header className="dialog-header">
          <div>
            <h2>{workOrderTitle(order)}</h2>
            <p>Histórico completo do serviço entregue.</p>
          </div>
          <button className="dialog-close" type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="dialog-body">
          <div className="delivered-detail-grid">
            <div><span>Aprovado</span><strong>{dateTime(order.approved_at)}</strong></div>
            <div><span>Iniciado</span><strong>{dateTime(order.started_at)}</strong></div>
            <div><span>Pronto</span><strong>{dateTime(order.ready_at)}</strong></div>
            <div><span>Entregue</span><strong>{dateTime(order.delivered_at)}</strong></div>
            <div><span>Prazo</span><strong>{order.due_date ? new Date(`${order.due_date}T12:00:00`).toLocaleDateString("pt-BR") : "—"}</strong></div>
            <div><span>Total</span><strong>{formatBRL(order.total)}</strong></div>
          </div>

          <div className="delivered-client-block">
            <span>CLIENTE</span>
            <strong>{order.client_snapshot_json?.name || "Cliente"}</strong>
            {order.client_snapshot_json?.phone ? <small>{order.client_snapshot_json.phone}</small> : null}
            {order.client_snapshot_json?.email ? <small>{order.client_snapshot_json.email}</small> : null}
          </div>

          <div className="delivered-items">
            <div className="delivered-items-head">
              <strong>Itens entregues</strong>
              <span>{order.items_snapshot_json?.length || 0} item(ns)</span>
            </div>

            {(order.items_snapshot_json || []).map((item, index) => (
              <div className="delivered-item-row" key={item.id || index}>
                <div>
                  <strong>{item.description}</strong>
                  <span>Qtd. {item.quantity}</span>
                </div>
                <strong>{formatBRL(item.total_price)}</strong>
              </div>
            ))}
          </div>

          {order.delivery_notes ? (
            <div className="delivered-notes">
              <strong>Observação da entrega</strong>
              <p>{order.delivery_notes}</p>
            </div>
          ) : null}
        </div>

        <footer className="dialog-footer">
          <button className="secondary-button" type="button" onClick={onClose}>
            Fechar
          </button>
          <Link className="primary-button dialog-save" to={`/orcamentos/${order.quote_id}/pdf`}>
            <FileText size={16} /> Abrir PDF
          </Link>
        </footer>
      </section>
    </div>
  );
}
