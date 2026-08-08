import { Copy, Edit3, PackageCheck, Power, PowerOff } from "lucide-react";
import { formatMaterialValue } from "../../lib/material";

export default function MaterialCard({ material, onEdit, onDuplicate, onToggle }) {
  return (
    <article className={`material-card ${material.active ? "" : "inactive"}`}>
      <div className="material-card-main">
        <div className={`material-icon ${material.use_in_wrapping ? "wrapping" : ""}`}>
          <PackageCheck size={20} />
        </div>
        <div className="material-copy">
          <div className="material-title-row">
            <strong>{material.name}</strong>
            {material.use_in_wrapping ? <span className="status-pill wrap">Envelopamento</span> : null}
            {!material.active ? <span className="status-pill neutral">Inativo</span> : null}
          </div>
          <span>{material.category?.name || "Sem categoria"} · {material.unit}</span>
          {material.roll_width ? <small>Rolo: {material.roll_width} m</small> : null}
        </div>
      </div>

      <div className="material-values">
        <div><small>Custo</small><strong>{formatMaterialValue(material.cost_value)}</strong></div>
        <div><small>Referência</small><strong>{formatMaterialValue(material.sale_value)}</strong></div>
      </div>

      <div className="material-card-actions">
        <button type="button" onClick={() => onEdit(material)} title="Editar"><Edit3 size={17} /></button>
        <button type="button" onClick={() => onDuplicate(material)} title="Duplicar"><Copy size={17} /></button>
        <button type="button" onClick={() => onToggle(material)} title={material.active ? "Desativar" : "Reativar"}>
          {material.active ? <PowerOff size={17} /> : <Power size={17} />}
        </button>
      </div>
    </article>
  );
}
