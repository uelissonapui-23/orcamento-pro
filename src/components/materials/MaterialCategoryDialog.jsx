import { Check, Pencil, Plus, Power, PowerOff, X } from "lucide-react";
import { useState } from "react";
import {
  createMaterialCategory,
  updateMaterialCategory,
} from "../../services/materialService";

export default function MaterialCategoryDialog({
  open,
  workspaceId,
  categories,
  onClose,
  onChanged,
}) {
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
      await createMaterialCategory(workspaceId, newName);
      setNewName("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a categoria.");
    } finally {
      setBusyId("");
    }
  };

  const saveEdit = async (category) => {
    if (!editingName.trim()) return;
    setBusyId(category.id);
    setError("");

    try {
      await updateMaterialCategory(category.id, { name: editingName.trim() });
      setEditingId("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível editar.");
    } finally {
      setBusyId("");
    }
  };

  const toggle = async (category) => {
    setBusyId(category.id);
    setError("");

    try {
      await updateMaterialCategory(category.id, { active: !category.active });
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
          <div><h2>Categorias de materiais</h2><p>Use categorias simples para organizar o cadastro.</p></div>
          <button className="dialog-close" type="button" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="dialog-body">
          {error ? <div className="form-alert error">{error}</div> : null}

          <form className="category-create-row" onSubmit={create}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nova categoria..." />
            <button className="primary-button" disabled={busyId === "new"} type="submit"><Plus size={17} /> Adicionar</button>
          </form>

          <div className="category-list">
            {categories.map((category) => (
              <div className={`category-row ${category.active ? "" : "inactive"}`} key={category.id}>
                {editingId === category.id ? (
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus />
                ) : (
                  <div><strong>{category.name}</strong>{!category.active ? <small>Inativa</small> : null}</div>
                )}

                <div className="category-row-actions">
                  {editingId === category.id ? (
                    <button type="button" onClick={() => saveEdit(category)} disabled={busyId === category.id}><Check size={17} /></button>
                  ) : (
                    <button type="button" onClick={() => { setEditingId(category.id); setEditingName(category.name); }}><Pencil size={16} /></button>
                  )}
                  <button type="button" onClick={() => toggle(category)} disabled={busyId === category.id}>
                    {category.active ? <PowerOff size={16} /> : <Power size={16} />}
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
