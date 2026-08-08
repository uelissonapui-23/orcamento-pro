import { Check, Pencil, Plus, Power, PowerOff, X } from "lucide-react";
import { useState } from "react";
import { createVehicleType, updateVehicleType } from "../../services/vehicleService";

export default function VehicleTypeDialog({ open, workspaceId, types, onClose, onChanged }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const create = async (event) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setBusyId("new");
    setError("");

    try {
      await createVehicleType(workspaceId, newName);
      setNewName("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar.");
    } finally {
      setBusyId("");
    }
  };

  const saveEdit = async (type) => {
    if (!editingName.trim()) return;
    setBusyId(type.id);

    try {
      await updateVehicleType(type.id, { name: editingName.trim() });
      setEditingId("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível editar.");
    } finally {
      setBusyId("");
    }
  };

  const toggle = async (type) => {
    setBusyId(type.id);

    try {
      await updateVehicleType(type.id, { active: !type.active });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="category-dialog" role="dialog" aria-modal="true">
        <header className="dialog-header">
          <div><h2>Tipos de veículo</h2><p>Ex.: Carro, Caminhonete, Van, Moto.</p></div>
          <button className="dialog-close" type="button" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="dialog-body">
          {error ? <div className="form-alert error">{error}</div> : null}

          <form className="category-create-row" onSubmit={create}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Novo tipo..." />
            <button className="primary-button" disabled={busyId === "new"} type="submit"><Plus size={17} /> Adicionar</button>
          </form>

          <div className="category-list">
            {types.map((type) => (
              <div className={`category-row ${type.active ? "" : "inactive"}`} key={type.id}>
                {editingId === type.id ? (
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus />
                ) : (
                  <div><strong>{type.name}</strong>{!type.active ? <small>Inativo</small> : null}</div>
                )}
                <div className="category-row-actions">
                  {editingId === type.id ? (
                    <button type="button" onClick={() => saveEdit(type)} disabled={busyId === type.id}><Check size={17} /></button>
                  ) : (
                    <button type="button" onClick={() => { setEditingId(type.id); setEditingName(type.name); }}><Pencil size={16} /></button>
                  )}
                  <button type="button" onClick={() => toggle(type)} disabled={busyId === type.id}>
                    {type.active ? <PowerOff size={16} /> : <Power size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
