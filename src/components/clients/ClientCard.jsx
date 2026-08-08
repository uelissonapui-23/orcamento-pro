import { Edit3, MessageCircle, MoreHorizontal, Power, PowerOff } from "lucide-react";
import { formatClientLocation } from "../../lib/client";

export default function ClientCard({ client, onEdit, onToggle }) {
  const location = formatClientLocation(client);
  const contact = client.whatsapp || client.phone || client.email || "Sem contato";
  const whatsappDigits = String(client.whatsapp || "").replace(/\D+/g, "");

  return (
    <article className={`client-card ${client.active ? "" : "inactive"}`}>
      <div className="client-card-main">
        <div className="client-avatar">{client.name.slice(0, 2).toUpperCase()}</div>
        <div className="client-card-copy">
          <div className="client-name-row">
            <strong>{client.name}</strong>
            {!client.active ? <span className="status-pill neutral">Inativo</span> : null}
          </div>
          {client.trade_name ? <span className="client-company">{client.trade_name}</span> : null}
          <span>{contact}</span>
          {location ? <span>{location}</span> : null}
        </div>
      </div>

      <div className="client-card-actions">
        {whatsappDigits ? (
          <a
            className="client-icon-action whatsapp"
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noreferrer"
            title="Abrir WhatsApp"
          >
            <MessageCircle size={18} />
          </a>
        ) : null}

        <button className="client-icon-action" type="button" onClick={() => onEdit(client)} title="Editar cliente">
          <Edit3 size={18} />
        </button>

        <button
          className={`client-icon-action ${client.active ? "danger-soft" : "success-soft"}`}
          type="button"
          onClick={() => onToggle(client)}
          title={client.active ? "Desativar" : "Reativar"}
        >
          {client.active ? <PowerOff size={18} /> : <Power size={18} />}
        </button>
      </div>
    </article>
  );
}
