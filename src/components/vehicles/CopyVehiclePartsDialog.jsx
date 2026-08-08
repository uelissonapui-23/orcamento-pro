import { Copy, X } from "lucide-react";
import { useState } from "react";
import { copyVehicleParts } from "../../services/vehicleService";
import { vehicleDisplayName } from "../../lib/vehicle";

export default function CopyVehiclePartsDialog({ open, vehicles, onClose, onCopied }) {
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!sourceId || !targetId) {
      setError("Escolha origem e destino.");
      return;
    }

    if (sourceId === targetId) {
      setError("Origem e destino precisam ser diferentes.");
      return;
    }

    if (!window.confirm("As peças atuais do modelo de destino serão substituídas. Continuar?")) return;

    setBusy(true);

    try {
      await copyVehicleParts(sourceId, targetId);
      await onCopied?.();
      setSourceId("");
      setTargetId("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível copiar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <section className="copy-parts-dialog" role="dialog" aria-modal="true">
        <header className="dialog-header">
          <div><h2>Copiar peças entre modelos</h2><p>Útil quando dois veículos usam conjuntos parecidos.</p></div>
          <button className="dialog-close" type="button" onClick={onClose}><X size={20} /></button>
        </header>

        <form onSubmit={submit}>
          <div className="dialog-body copy-parts-form">
            {error ? <div className="form-alert error">{error}</div> : null}

            <label>
              <span>Copiar peças de</span>
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                <option value="">Escolha...</option>
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicleDisplayName(vehicle)}</option>)}
              </select>
            </label>

            <label>
              <span>Para o modelo</span>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">Escolha...</option>
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicleDisplayName(vehicle)}</option>)}
              </select>
            </label>
          </div>

          <footer className="dialog-footer">
            <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
            <button className="primary-button dialog-save" type="submit" disabled={busy}>
              <Copy size={16} /> {busy ? "Copiando..." : "Copiar peças"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
