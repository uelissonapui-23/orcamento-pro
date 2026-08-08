import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { EMPTY_CLIENT, normalizeClient, validateClient } from "../../lib/client";
import { createClient, findLikelyDuplicates, updateClient } from "../../services/clientService";
import ClientForm from "./ClientForm";

function messageFrom(error) {
  if (!(error instanceof Error)) return "Ocorreu um erro inesperado.";
  if (/clients_document_unique/i.test(error.message)) return "Já existe um cliente com este CPF/CNPJ.";
  return error.message;
}

export default function ClientDialog({
  open,
  workspaceId,
  client = null,
  quick = false,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [errors, setErrors] = useState({});
  const [duplicates, setDuplicates] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(normalizeClient(client || EMPTY_CLIENT));
    setErrors({});
    setDuplicates([]);
    setStatus("");
  }, [open, client]);

  if (!open) return null;

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setStatus("");
  };

  const save = async (event, force = false) => {
    event?.preventDefault?.();

    const validation = validateClient(form, { quick });
    setErrors(validation.errors);

    if (!validation.valid) return;

    setBusy(true);
    setStatus("");

    try {
      if (!force) {
        const matches = await findLikelyDuplicates(workspaceId, validation.client, client?.id || null);
        if (matches.length) {
          setDuplicates(matches);
          setBusy(false);
          return;
        }
      }

      const saved = client?.id
        ? await updateClient(client.id, validation.client)
        : await createClient(workspaceId, validation.client);

      onSaved?.(saved);
      onClose();
    } catch (error) {
      setStatus(messageFrom(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <section className={`client-dialog ${quick ? "quick" : ""}`} role="dialog" aria-modal="true" aria-labelledby="client-dialog-title">
        <header className="dialog-header">
          <div>
            <h2 id="client-dialog-title">{client?.id ? "Editar cliente" : quick ? "Cliente rápido" : "Novo cliente"}</h2>
            <p>{quick ? "Cadastre só o essencial. Você completa a ficha depois." : "Dados que serão reutilizados nos próximos orçamentos."}</p>
          </div>
          <button className="dialog-close" type="button" disabled={busy} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={save}>
          <div className="dialog-body">
            {status ? <div className="form-alert error">{status}</div> : null}

            {duplicates.length ? (
              <div className="duplicate-warning">
                <strong>Possível cliente já cadastrado</strong>
                <p>Encontramos contato ou documento igual. Evitar duplicidade mantém o histórico organizado.</p>
                <div className="duplicate-list">
                  {duplicates.map((item) => (
                    <div key={item.id}>
                      <span>{item.name}</span>
                      <small>{item.whatsapp || item.phone || item.document || item.email}</small>
                    </div>
                  ))}
                </div>
                <div className="duplicate-actions">
                  <button className="secondary-button" type="button" disabled={busy} onClick={() => setDuplicates([])}>
                    Revisar dados
                  </button>
                  <button className="text-button" type="button" disabled={busy} onClick={(e) => save(e, true)}>
                    Salvar mesmo assim
                  </button>
                </div>
              </div>
            ) : null}

            <ClientForm value={form} errors={errors} onChange={update} quick={quick} />
          </div>

          <footer className="dialog-footer">
            <button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Cancelar</button>
            <button className="primary-button dialog-save" type="submit" disabled={busy || duplicates.length > 0}>
              {busy ? "Salvando..." : client?.id ? "Salvar alterações" : "Cadastrar cliente"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
