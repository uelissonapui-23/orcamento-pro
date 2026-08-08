import { Copy, Edit3, Power, PowerOff } from "lucide-react";
import { calculationModeMeta, formatProductPrice } from "../../lib/product";

export default function ProductCard({ product, onEdit, onDuplicate, onToggle }) {
  const mode = calculationModeMeta(product.calculation_mode);

  return (
    <article className={`product-card ${product.active ? "" : "inactive"}`}>
      <div className="product-card-main">
        <div className="product-mode-badge">{mode.shortLabel}</div>
        <div className="product-card-copy">
          <div className="product-title-row">
            <strong>{product.name}</strong>
            {!product.active ? <span className="status-pill neutral">Inativo</span> : null}
          </div>
          <span>{product.category?.name || "Sem categoria"} · {mode.label}</span>
          {product.description ? <small>{product.description}</small> : null}
        </div>
      </div>

      <div className="product-card-price">
        <span>{formatProductPrice(product)}</span>
        {Number(product.minimum_price) > 0 ? <small>Mínimo R$ {Number(product.minimum_price).toFixed(2).replace(".", ",")}</small> : null}
      </div>

      <div className="product-card-actions">
        <button type="button" onClick={() => onEdit(product)} title="Editar"><Edit3 size={17} /></button>
        <button type="button" onClick={() => onDuplicate(product)} title="Duplicar"><Copy size={17} /></button>
        <button type="button" onClick={() => onToggle(product)} title={product.active ? "Desativar" : "Reativar"}>
          {product.active ? <PowerOff size={17} /> : <Power size={17} />}
        </button>
      </div>
    </article>
  );
}
