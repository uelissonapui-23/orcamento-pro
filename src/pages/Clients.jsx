import { Plus, Search, UserRoundPlus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ClientCard from "../components/clients/ClientCard";
import ClientDialog from "../components/clients/ClientDialog";
import QuickClientDialog from "../components/clients/QuickClientDialog";
import { useAuth } from "../contexts/AuthContext";
import { listClients, setClientActive } from "../services/clientService";

function errorMessage(error) {
  return error instanceof Error ? error.message : "Não foi possível carregar os clientes.";
}

export default function Clients() {
  const [searchParams] = useSearchParams();
  const { workspace } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [dialog, setDialog] = useState({ open: false, client: null, quick: false });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (!workspace?.id) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = await listClients(workspace.id, {
        search: debouncedSearch,
        status: statusFilter,
      });
      setClients(data);
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, debouncedSearch, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const onSaved = () => {
    setMessage({ type: "success", text: "Cliente salvo." });
    load();
  };

  const toggle = async (client) => {
    const action = client.active ? "desativar" : "reativar";
    const confirmed = window.confirm(`${client.active ? "Desativar" : "Reativar"} ${client.name}?`);
    if (!confirmed) return;

    try {
      await setClientActive(client.id, !client.active);
      setMessage({ type: "success", text: `Cliente ${action === "desativar" ? "desativado" : "reativado"}.` });
      load();
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    }
  };

  return (
    <div className="clients-module">
      <div className="clients-toolbar">
        <div className="client-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar por nome, telefone, documento ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="client-filter" role="group" aria-label="Status dos clientes">
          {[
            ["active", "Ativos"],
            ["all", "Todos"],
            ["inactive", "Inativos"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={statusFilter === value ? "active" : ""}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="clients-toolbar-actions">
          <button className="secondary-button" type="button" onClick={() => setDialog({ open: true, client: null, quick: true })}>
            <UserRoundPlus size={17} />
            Cliente rápido
          </button>
          <button className="primary-button clients-add" type="button" onClick={() => setDialog({ open: true, client: null, quick: false })}>
            <Plus size={18} />
            Novo cliente
          </button>
        </div>
      </div>

      {message.text ? <div className={`form-alert ${message.type} clients-message`}>{message.text}</div> : null}

      {loading ? (
        <div className="clients-state">
          <div className="spinner" />
          <strong>Carregando clientes...</strong>
        </div>
      ) : clients.length ? (
        <div className="clients-list">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={(selected) => setDialog({ open: true, client: selected, quick: false })}
              onToggle={toggle}
            />
          ))}
        </div>
      ) : (
        <div className="clients-empty">
          <div className="clients-empty-icon"><Users size={28} /></div>
          <strong>{debouncedSearch ? "Nenhum cliente encontrado" : "Comece cadastrando seu primeiro cliente"}</strong>
          <p>{debouncedSearch ? "Tente outro termo ou altere o filtro." : "Depois você poderá escolhê-lo nos orçamentos sem digitar tudo novamente."}</p>
          {!debouncedSearch ? (
            <button className="primary-button" type="button" onClick={() => setDialog({ open: true, client: null, quick: false })}>
              <Plus size={18} />
              Cadastrar cliente
            </button>
          ) : null}
        </div>
      )}

      <ClientDialog
        open={dialog.open && !dialog.quick}
        workspaceId={workspace?.id}
        client={dialog.client}
        onClose={() => setDialog({ open: false, client: null, quick: false })}
        onSaved={onSaved}
      />

      <QuickClientDialog
        open={dialog.open && dialog.quick}
        workspaceId={workspace?.id}
        onClose={() => setDialog({ open: false, client: null, quick: false })}
        onSaved={onSaved}
      />
    </div>
  );
}
