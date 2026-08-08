import { PackageSearch, Plus, Search, Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MaterialCard from "../components/materials/MaterialCard";
import MaterialCategoryDialog from "../components/materials/MaterialCategoryDialog";
import MaterialDialog from "../components/materials/MaterialDialog";
import { useAuth } from "../contexts/AuthContext";
import {
  duplicateMaterial,
  listMaterialCategories,
  listMaterials,
  setMaterialActive,
} from "../services/materialService";

function errorMessage(error) {
  return error instanceof Error ? error.message : "Não foi possível carregar os materiais.";
}

export default function Materials() {
  const [searchParams] = useSearchParams();
  const { workspace } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [wrappingFilter, setWrappingFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [dialog, setDialog] = useState({ open: false, material: null });
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadCategories = useCallback(async () => {
    if (!workspace?.id) return;
    const [active, all] = await Promise.all([
      listMaterialCategories(workspace.id),
      listMaterialCategories(workspace.id, { includeInactive: true }),
    ]);
    setCategories(active);
    setAllCategories(all);
  }, [workspace?.id]);

  const loadMaterials = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = await listMaterials(workspace.id, {
        search: debouncedSearch,
        status: statusFilter,
        categoryId: categoryFilter,
        wrapping: wrappingFilter,
      });
      setMaterials(data);
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, debouncedSearch, statusFilter, categoryFilter, wrappingFilter]);

  useEffect(() => {
    loadCategories().catch((error) => setMessage({ type: "error", text: errorMessage(error) }));
  }, [loadCategories]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const refresh = async () => Promise.all([loadCategories(), loadMaterials()]);

  const toggle = async (material) => {
    if (!window.confirm(`${material.active ? "Desativar" : "Reativar"} ${material.name}?`)) return;

    try {
      await setMaterialActive(material.id, !material.active);
      setMessage({ type: "success", text: material.active ? "Material desativado." : "Material reativado." });
      loadMaterials();
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    }
  };

  const duplicate = async (material) => {
    if (!window.confirm(`Criar uma cópia de "${material.name}"?`)) return;

    try {
      await duplicateMaterial(material.id);
      setMessage({ type: "success", text: "Material duplicado." });
      loadMaterials();
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    }
  };

  return (
    <div className="materials-module">
      <div className="materials-toolbar">
        <div className="material-search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar material..." />
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>

        <select value={wrappingFilter} onChange={(e) => setWrappingFilter(e.target.value)} aria-label="Uso no envelopamento">
          <option value="all">Todos os usos</option>
          <option value="yes">Usa no envelopamento</option>
          <option value="no">Não usa no envelopamento</option>
        </select>

        <div className="material-filter">
          {[["active", "Ativos"], ["all", "Todos"], ["inactive", "Inativos"]].map(([value, label]) => (
            <button key={value} type="button" className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}>
              {label}
            </button>
          ))}
        </div>

        <div className="materials-actions">
          <button className="secondary-button" type="button" onClick={() => setCategoriesOpen(true)}>
            <Tags size={16} /> Categorias
          </button>
          <button className="primary-button" type="button" onClick={() => setDialog({ open: true, material: null })}>
            <Plus size={18} /> Novo material
          </button>
        </div>
      </div>

      {message.text ? <div className={`form-alert ${message.type} materials-message`}>{message.text}</div> : null}

      {loading ? (
        <div className="materials-state"><div className="spinner" /><strong>Carregando materiais...</strong></div>
      ) : materials.length ? (
        <div className="materials-list">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onEdit={(selected) => setDialog({ open: true, material: selected })}
              onDuplicate={duplicate}
              onToggle={toggle}
            />
          ))}
        </div>
      ) : (
        <div className="materials-empty">
          <div className="materials-empty-icon"><PackageSearch size={28} /></div>
          <strong>{debouncedSearch ? "Nenhum material encontrado" : "Cadastre o primeiro material"}</strong>
          <p>Materiais poderão ser vinculados aos produtos e filtrados automaticamente no wizard de envelopamento.</p>
          {!debouncedSearch ? (
            <button className="primary-button" type="button" onClick={() => setDialog({ open: true, material: null })}>
              <Plus size={18} /> Cadastrar material
            </button>
          ) : null}
        </div>
      )}

      <MaterialDialog
        open={dialog.open}
        workspaceId={workspace?.id}
        material={dialog.material}
        categories={categories}
        onClose={() => setDialog({ open: false, material: null })}
        onSaved={() => { setMessage({ type: "success", text: "Material salvo." }); refresh(); }}
        onCategoryCreated={() => loadCategories()}
      />

      <MaterialCategoryDialog
        open={categoriesOpen}
        workspaceId={workspace?.id}
        categories={allCategories}
        onClose={() => setCategoriesOpen(false)}
        onChanged={loadCategories}
      />
    </div>
  );
}
