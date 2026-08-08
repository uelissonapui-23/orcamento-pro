import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { EMPTY_MATERIAL, normalizeMaterial, validateMaterial } from "../../lib/material";
import {
  createMaterial,
  createMaterialCategory,
  updateMaterial,
} from "../../services/materialService";
import MaterialForm from "./MaterialForm";

function errorMessage(error) {
  if (!(error instanceof Error)) return "Ocorreu um erro inesperado.";
  if (/material_categories_workspace_name_unique/i.test(error.message)) return "Já existe uma categoria com esse nome.";
  return error.message;
}

export default function MaterialDialog({
  open,
  workspaceId,
  material = null,
  categories,
  onClose,
  onSaved,
  onCategoryCreated,
}) {
  const [form, setForm] = useState(EMPTY_MATERIAL);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(normalizeMaterial(material || EMPTY_MATERIAL));
    setErrors({});
    setStatus("");
  }, [open, material]);

  if (!open) return null;

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setStatus("");
  };

  const createCategory = async () => {
    const name = window.prompt("Nome da nova categoria:");
    if (!name?.trim()) return;

    try {
      const category = await createMaterialCategory(workspaceId, name);
      onCategoryCreated?.(category);
      update("category_id", category.id);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const validation = validateMaterial(form);
    setErrors(validation.errors);
    if (!validation.valid) return;

    setBusy(true);
    setStatus("");

    try {
      if (material?.id) {
        await updateMaterial(material.id, validation.material);
      } else {
        await createMaterial(workspaceId, validation.material);
      }

      onSaved?.();
      onClose();
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <section className="material-dialog" role="dialog" aria-modal="true" aria-labelledby="material-dialog-title">
        <header className="dialog-header">
          <div>
            <h2 id="material-dialog-title">{material?.id ? "Editar material" : "Novo material"}</h2>
            <p>Cadastre uma vez e reutilize nos produtos e no futuro wizard de envelopamento.</p>
          </div>
          <button className="dialog-close" type="button" disabled={busy} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={submit}>
          <div className="dialog-body">
            {status ? <div className="form-alert error">{status}</div> : null}
            <MaterialForm
              value={form}
              categories={categories}
              errors={errors}
              onChange={update}
              onCreateCategory={createCategory}
            />
          </div>

          <footer className="dialog-footer">
            <button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Cancelar</button>
            <button className="primary-button dialog-save" type="submit" disabled={busy}>
              {busy ? "Salvando..." : material?.id ? "Salvar alterações" : "Cadastrar"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
