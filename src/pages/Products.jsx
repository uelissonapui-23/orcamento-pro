import { Layers3, Plus, Search, Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import CategoryManagerDialog from "../components/products/CategoryManagerDialog";
import ProductCard from "../components/products/ProductCard";
import ProductDialog from "../components/products/ProductDialog";
import { useAuth } from "../contexts/AuthContext";
import { CALCULATION_MODES } from "../lib/product";
import { listMaterials } from "../services/materialService";
import {
  duplicateProduct,
  listProductCategories,
  listProducts,
  setProductActive,
} from "../services/productService";

function errorMessage(error) {
  return error instanceof Error ? error.message : "Não foi possível carregar os produtos.";
}

export default function Products() {
  const { workspace } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [dialog, setDialog] = useState({ open: false, product: null });
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadCategories = useCallback(async () => {
    if (!workspace?.id) return;
    const [active, all] = await Promise.all([
      listProductCategories(workspace.id),
      listProductCategories(workspace.id, { includeInactive: true }),
    ]);
    setCategories(active);
    setAllCategories(all);
  }, [workspace?.id]);

  const loadProducts = useCallback(async () => {
    if (!workspace?.id) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = await listProducts(workspace.id, {
        search: debouncedSearch,
        status: statusFilter,
        categoryId: categoryFilter,
        mode: modeFilter,
      });
      setProducts(data);
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, debouncedSearch, statusFilter, categoryFilter, modeFilter]);

  useEffect(() => {
    loadCategories().catch((error) => setMessage({ type: "error", text: errorMessage(error) }));
  }, [loadCategories]);

  useEffect(() => {
    if (!workspace?.id) return;
    listMaterials(workspace.id)
      .then(setMaterials)
      .catch((error) => setMessage({ type: "error", text: errorMessage(error) }));
  }, [workspace?.id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const refresh = async () => {
    await Promise.all([loadCategories(), loadProducts()]);
  };

  const toggle = async (product) => {
    if (!window.confirm(`${product.active ? "Desativar" : "Reativar"} ${product.name}?`)) return;

    try {
      await setProductActive(product.id, !product.active);
      setMessage({ type: "success", text: product.active ? "Produto desativado." : "Produto reativado." });
      loadProducts();
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    }
  };

  const duplicate = async (product) => {
    if (!window.confirm(`Criar uma cópia de "${product.name}"?`)) return;

    try {
      await duplicateProduct(product.id);
      setMessage({ type: "success", text: "Produto duplicado como rascunho ativo para edição." });
      loadProducts();
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    }
  };

  return (
    <div className="products-module">
      <div className="products-toolbar">
        <div className="product-search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou serviço..." />
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>

        <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} aria-label="Forma de cobrança">
          <option value="">Todas as cobranças</option>
          {CALCULATION_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
        </select>

        <div className="product-filter">
          {[["active", "Ativos"], ["all", "Todos"], ["inactive", "Inativos"]].map(([value, label]) => (
            <button key={value} type="button" className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}>
              {label}
            </button>
          ))}
        </div>

        <div className="products-actions">
          <button className="secondary-button" type="button" onClick={() => setCategoriesOpen(true)}>
            <Tags size={16} /> Categorias
          </button>
          <button className="primary-button" type="button" onClick={() => setDialog({ open: true, product: null })}>
            <Plus size={18} /> Novo produto
          </button>
        </div>
      </div>

      {message.text ? <div className={`form-alert ${message.type} products-message`}>{message.text}</div> : null}

      {loading ? (
        <div className="products-state"><div className="spinner" /><strong>Carregando produtos...</strong></div>
      ) : products.length ? (
        <div className="products-list">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={(selected) => setDialog({ open: true, product: selected })}
              onDuplicate={duplicate}
              onToggle={toggle}
            />
          ))}
        </div>
      ) : (
        <div className="products-empty">
          <div className="products-empty-icon"><Layers3 size={28} /></div>
          <strong>{debouncedSearch ? "Nenhum item encontrado" : "Cadastre o primeiro produto ou serviço"}</strong>
          <p>Depois, no orçamento, você escolherá o item e o app exibirá somente as medidas ou quantidades necessárias.</p>
          {!debouncedSearch ? (
            <button className="primary-button" type="button" onClick={() => setDialog({ open: true, product: null })}>
              <Plus size={18} /> Cadastrar
            </button>
          ) : null}
        </div>
      )}

      <ProductDialog
        open={dialog.open}
        workspaceId={workspace?.id}
        product={dialog.product}
        categories={categories}
        materials={materials}
        onClose={() => setDialog({ open: false, product: null })}
        onSaved={() => { setMessage({ type: "success", text: "Produto salvo." }); refresh(); }}
        onCategoryCreated={() => loadCategories()}
      />

      <CategoryManagerDialog
        open={categoriesOpen}
        workspaceId={workspace?.id}
        categories={allCategories}
        onClose={() => setCategoriesOpen(false)}
        onChanged={loadCategories}
      />
    </div>
  );
}
