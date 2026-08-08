import { Copy, Edit3, Image, Power, PowerOff } from "lucide-react";
import {
  totalVehicleArea,
  totalVehicleInstallMinutes,
  vehicleDisplayName,
} from "../../lib/vehicle";

export default function VehicleCard({ vehicle, onEdit, onDuplicate, onToggle, onImage }) {
  const activeParts = (vehicle.parts || []).filter((part) => part.active !== false);

  return (
    <article className={`vehicle-card ${vehicle.active ? "" : "inactive"}`}>
      <div className="vehicle-card-main">
        <div className="vehicle-card-icon">{vehicle.type?.name?.slice(0, 2).toUpperCase() || "V"}</div>
        <div className="vehicle-card-copy">
          <div className="vehicle-title-row">
            <strong>{vehicleDisplayName(vehicle)}</strong>
            {!vehicle.active ? <span className="status-pill neutral">Inativo</span> : null}
          </div>
          <span>{vehicle.type?.name || "Sem tipo"} · {activeParts.length} peça(s)</span>
          <small>{totalVehicleArea(activeParts)} m² · {totalVehicleInstallMinutes(activeParts)} min previstos</small>
        </div>
      </div>

      <div className="vehicle-card-actions">
        <button type="button" onClick={() => onImage(vehicle)} title="Imagem"><Image size={17} /></button>
        <button type="button" onClick={() => onEdit(vehicle)} title="Editar"><Edit3 size={17} /></button>
        <button type="button" onClick={() => onDuplicate(vehicle)} title="Duplicar"><Copy size={17} /></button>
        <button type="button" onClick={() => onToggle(vehicle)} title={vehicle.active ? "Desativar" : "Reativar"}>
          {vehicle.active ? <PowerOff size={17} /> : <Power size={17} />}
        </button>
      </div>
    </article>
  );
}
