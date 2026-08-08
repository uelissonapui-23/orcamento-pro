import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  EMPTY_VEHICLE_MODEL,
  normalizeVehicleModel,
  validateVehicleModel,
} from "../../lib/vehicle";
import {
  createVehicleType,
  saveVehicleModel,
} from "../../services/vehicleService";
import VehicleModelForm from "./VehicleModelForm";

export default function VehicleModelDialog({
  open,
  workspaceId,
  vehicle = null,
  types,
  onClose,
  onSaved,
  onTypeCreated,
}) {
  const [form, setForm] = useState(EMPTY_VEHICLE_MODEL);
  const [parts, setParts] = useState([]);
  const [errors, setErrors] = useState({});
  const [partErrors, setPartErrors] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(normalizeVehicleModel(vehicle || EMPTY_VEHICLE_MODEL));
    setParts(vehicle?.parts || []);
    setErrors({});
    setPartErrors([]);
    setStatus("");
  }, [open, vehicle]);

  if (!open) return null;

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setStatus("");
  };

  const createType = async () => {
    const name = window.prompt("Novo tipo de veículo:");
    if (!name?.trim()) return;

    try {
      const type = await createVehicleType(workspaceId, name);
      await onTypeCreated?.();
      update("vehicle_type_id", type.id);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível criar o tipo.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const validation = validateVehicleModel(form, parts);
    setErrors(validation.errors);
    setPartErrors(validation.partErrors);

    if (!validation.valid) return;

    setBusy(true);
    setStatus("");

    try {
      await saveVehicleModel(
        workspaceId,
        vehicle?.id || null,
        validation.model,
        validation.parts,
      );
      onSaved?.();
      onClose();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <section className="vehicle-dialog" role="dialog" aria-modal="true" aria-labelledby="vehicle-dialog-title">
        <header className="dialog-header">
          <div>
            <h2 id="vehicle-dialog-title">{vehicle?.id ? "Editar veículo" : "Novo veículo"}</h2>
            <p>Cadastre modelo e peças agora para o wizard apenas selecionar e calcular depois.</p>
          </div>
          <button className="dialog-close" type="button" disabled={busy} onClick={onClose}><X size={20} /></button>
        </header>

        <form onSubmit={submit}>
          <div className="dialog-body">
            {status ? <div className="form-alert error">{status}</div> : null}
            <VehicleModelForm
              value={form}
              types={types}
              parts={parts}
              errors={errors}
              partErrors={partErrors}
              onChange={update}
              onPartsChange={setParts}
              onCreateType={createType}
            />
          </div>

          <footer className="dialog-footer">
            <button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Cancelar</button>
            <button className="primary-button dialog-save" type="submit" disabled={busy}>
              {busy ? "Salvando..." : vehicle?.id ? "Salvar alterações" : "Cadastrar veículo"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
