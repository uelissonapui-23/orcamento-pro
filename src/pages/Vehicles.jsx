import { CarFront, Copy, Plus, Search, Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import CopyVehiclePartsDialog from "../components/vehicles/CopyVehiclePartsDialog";
import VehicleCard from "../components/vehicles/VehicleCard";
import VehicleImageDialog from "../components/vehicles/VehicleImageDialog";
import VehicleModelDialog from "../components/vehicles/VehicleModelDialog";
import VehicleTypeDialog from "../components/vehicles/VehicleTypeDialog";
import { useAuth } from "../contexts/AuthContext";
import {
  duplicateVehicleModel,
  listVehicleModels,
  listVehicleTypes,
  setVehicleModelActive,
} from "../services/vehicleService";

function errorMessage(error) {
  return error instanceof Error ? error.message : "Não foi possível carregar os veículos.";
}

export default function Vehicles() {
  const { workspace } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [types, setTypes] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [dialog, setDialog] = useState({ open: false, vehicle: null });
  const [typesOpen, setTypesOpen] = useState(false);
  const [imageVehicle, setImageVehicle] = useState(null);
  const [copyOpen, setCopyOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadTypes = useCallback(async () => {
    if (!workspace?.id) return;
    const [active, all] = await Promise.all([
      listVehicleTypes(workspace.id),
      listVehicleTypes(workspace.id, { includeInactive: true }),
    ]);
    setTypes(active);
    setAllTypes(all);
  }, [workspace?.id]);

  const loadVehicles = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = await listVehicleModels(workspace.id, {
        search: debouncedSearch,
        status: statusFilter,
        typeId: typeFilter,
      });
      setVehicles(data);
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    loadTypes().catch((error) => setMessage({ type: "error", text: errorMessage(error) }));
  }, [loadTypes]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const refresh = async () => Promise.all([loadTypes(), loadVehicles()]);

  const toggle = async (vehicle) => {
    if (!window.confirm(`${vehicle.active ? "Desativar" : "Reativar"} ${vehicle.brand} ${vehicle.model}?`)) return;

    try {
      await setVehicleModelActive(vehicle.id, !vehicle.active);
      setMessage({ type: "success", text: vehicle.active ? "Veículo desativado." : "Veículo reativado." });
      loadVehicles();
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    }
  };

  const duplicate = async (vehicle) => {
    if (!window.confirm(`Duplicar ${vehicle.brand} ${vehicle.model} com todas as peças?`)) return;

    try {
      await duplicateVehicleModel(vehicle.id);
      setMessage({ type: "success", text: "Modelo e peças duplicados." });
      loadVehicles();
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    }
  };

  return (
    <div className="vehicles-module">
      <div className="vehicles-toolbar">
        <div className="vehicle-search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar marca ou modelo..." />
        </div>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Todos os tipos</option>
          {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>

        <div className="vehicle-filter">
          {[["active", "Ativos"], ["all", "Todos"], ["inactive", "Inativos"]].map(([value, label]) => (
            <button key={value} type="button" className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}>
              {label}
            </button>
          ))}
        </div>

        <div className="vehicles-actions">
          <button className="secondary-button" type="button" onClick={() => setTypesOpen(true)}><Tags size={16} /> Tipos</button>
          <button className="secondary-button" type="button" disabled={vehicles.length < 2} onClick={() => setCopyOpen(true)}><Copy size={16} /> Copiar peças</button>
          <button className="primary-button" type="button" onClick={() => setDialog({ open: true, vehicle: null })}><Plus size={18} /> Novo veículo</button>
        </div>
      </div>

      {message.text ? <div className={`form-alert ${message.type} vehicles-message`}>{message.text}</div> : null}

      {loading ? (
        <div className="vehicles-state"><div className="spinner" /><strong>Carregando veículos...</strong></div>
      ) : vehicles.length ? (
        <div className="vehicles-list">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={(selected) => setDialog({ open: true, vehicle: selected })}
              onDuplicate={duplicate}
              onToggle={toggle}
              onImage={setImageVehicle}
            />
          ))}
        </div>
      ) : (
        <div className="vehicles-empty">
          <div className="vehicles-empty-icon"><CarFront size={30} /></div>
          <strong>{debouncedSearch ? "Nenhum veículo encontrado" : "Cadastre o primeiro veículo"}</strong>
          <p>Cadastre modelo e peças uma vez. No wizard, o usuário só escolherá o veículo, as peças e o material.</p>
          {!debouncedSearch ? (
            <button className="primary-button" type="button" onClick={() => setDialog({ open: true, vehicle: null })}><Plus size={18} /> Cadastrar veículo</button>
          ) : null}
        </div>
      )}

      <VehicleModelDialog
        open={dialog.open}
        workspaceId={workspace?.id}
        vehicle={dialog.vehicle}
        types={types}
        onClose={() => setDialog({ open: false, vehicle: null })}
        onSaved={() => { setMessage({ type: "success", text: "Veículo salvo." }); refresh(); }}
        onTypeCreated={loadTypes}
      />

      <VehicleTypeDialog
        open={typesOpen}
        workspaceId={workspace?.id}
        types={allTypes}
        onClose={() => setTypesOpen(false)}
        onChanged={loadTypes}
      />

      <VehicleImageDialog
        open={Boolean(imageVehicle)}
        workspaceId={workspace?.id}
        vehicle={imageVehicle}
        onClose={() => setImageVehicle(null)}
        onChanged={async () => {
          await loadVehicles();
          setImageVehicle((current) => current ? vehicles.find((item) => item.id === current.id) || current : current);
        }}
      />

      <CopyVehiclePartsDialog
        open={copyOpen}
        vehicles={vehicles}
        onClose={() => setCopyOpen(false)}
        onCopied={() => { setMessage({ type: "success", text: "Peças copiadas." }); loadVehicles(); }}
      />
    </div>
  );
}
