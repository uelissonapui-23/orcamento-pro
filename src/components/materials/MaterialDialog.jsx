import { ImagePlus, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import { EMPTY_MATERIAL, normalizeMaterial, validateMaterial } from "../../lib/material";
import {
  createMaterial,
  createMaterialCategory,
  updateMaterial,
  createMaterialImageUrl,
  uploadMaterialImage,
  removeMaterialImage,
} from "../../services/materialService";
import MaterialForm from "./MaterialForm";

function errorMessage(error) {
  const message = error instanceof Error
    ? error.message
    : String(error?.message || error?.details || error?.hint || "").trim();
  if (/material_categories_workspace_name_unique/i.test(message)) return "Já existe uma categoria com esse nome.";
  return message || "Não foi possível salvar o material. Tente novamente.";
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(normalizeMaterial(material || EMPTY_MATERIAL));
    setErrors({});
    setStatus("");
    setImageFile(null);
    setRemoveImage(false);
    setImagePreview("");
    if (material?.image_path) {
      createMaterialImageUrl(material.image_path).then(setImagePreview).catch(() => setImagePreview(""));
    }
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
      let saved;
      if (material?.id) saved = await updateMaterial(material.id, validation.material);
      else saved = await createMaterial(workspaceId, validation.material);

      if (removeImage && saved.image_path) {
        await removeMaterialImage(workspaceId, saved.id, saved.image_path);
        saved = { ...saved, image_path: "" };
      }
      if (imageFile) {
        await uploadMaterialImage(workspaceId, saved.id, imageFile, removeImage ? "" : saved.image_path);
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

            <div className="material-image-editor">
              <div className="material-image-preview">
                {imagePreview && !removeImage ? <img src={imagePreview} alt="Prévia do material" /> : <div><ImagePlus size={28} /><span>Sem imagem</span></div>}
              </div>
              <div className="material-image-editor-actions">
                <label className="secondary-button material-image-upload">
                  <UploadCloud size={16} /> {imagePreview && !removeImage ? "Trocar imagem" : "Adicionar imagem"}
                  <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImageFile(file);
                    setRemoveImage(false);
                    setImagePreview(URL.createObjectURL(file));
                    e.target.value = "";
                  }} />
                </label>
                {imagePreview && !removeImage ? <button className="text-danger-button" type="button" onClick={() => { setImageFile(null); setRemoveImage(true); setImagePreview(""); }}><Trash2 size={15} /> Remover</button> : null}
                <small>Essa imagem aparece como miniatura no wizard para facilitar a escolha do material.</small>
              </div>
            </div>

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
