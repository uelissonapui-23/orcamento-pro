import { ImagePlus, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createVehicleImageUrl,
  removeVehicleImage,
  uploadVehicleImage,
} from "../../services/vehicleService";

export default function VehicleImageDialog({ open, workspaceId, vehicle, onClose, onChanged }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !vehicle) return;
    setError("");
    if (!vehicle.image_path) {
      setPreview("");
      return;
    }
    createVehicleImageUrl(vehicle.image_path)
      .then(setPreview)
      .catch(() => setPreview(""));
  }, [open, vehicle]);

  if (!open || !vehicle) return null;

  const upload = async (file) => {
    setBusy(true);
    setError("");

    try {
      const path = await uploadVehicleImage(workspaceId, vehicle.id, file, vehicle.image_path);
      const url = await createVehicleImageUrl(path);
      setPreview(url);
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!vehicle.image_path) return;
    setBusy(true);
    setError("");

    try {
      await removeVehicleImage(workspaceId, vehicle.id, vehicle.image_path);
      setPreview("");
      await onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível remover.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <section className="vehicle-image-dialog" role="dialog" aria-modal="true">
        <header className="dialog-header">
          <div><h2>Imagem do veículo</h2><p>Ajuda a identificar o modelo no cadastro e no wizard.</p></div>
          <button className="dialog-close" type="button" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="dialog-body">
          {error ? <div className="form-alert error">{error}</div> : null}

          <div className="vehicle-image-preview">
            {preview ? <img src={preview} alt="" /> : <div><ImagePlus size={34} /><span>Sem imagem</span></div>}
          </div>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />

          <div className="vehicle-image-actions">
            <button className="secondary-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
              <UploadCloud size={17} /> {vehicle.image_path ? "Trocar imagem" : "Enviar imagem"}
            </button>
            {vehicle.image_path ? (
              <button className="text-danger-button" type="button" disabled={busy} onClick={remove}>
                <Trash2 size={16} /> Remover
              </button>
            ) : null}
          </div>
          <small className="vehicle-image-help">PNG, JPG ou WebP. Máximo 3 MB. Armazenamento privado.</small>
        </div>
      </section>
    </div>
  );
}
