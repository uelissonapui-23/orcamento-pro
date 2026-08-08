import { normalizeProduct, normalizeTier } from "../lib/product";
import { supabase } from "../lib/supabase";

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

function cleanSearch(value) {
  return String(value || "").trim().replace(/[%_,()]/g, " ");
}

export async function listProductCategories(workspaceId, { includeInactive = false } = {}) {
  const client = requireClient();
  let query = client
    .schema("orcamento_app")
    .from("product_categories")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createProductCategory(workspaceId, name) {
  const client = requireClient();
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Informe o nome da categoria.");

  const { data, error } = await client
    .schema("orcamento_app")
    .from("product_categories")
    .insert({ workspace_id: workspaceId, name: cleanName })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProductCategory(categoryId, values) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("product_categories")
    .update(values)
    .eq("id", categoryId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listProducts(
  workspaceId,
  { search = "", status = "active", categoryId = "", mode = "" } = {},
) {
  const client = requireClient();
  let query = client
    .schema("orcamento_app")
    .from("products")
    .select("*, product_categories(id,name), product_price_tiers(*)")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (mode) query = query.eq("calculation_mode", mode);

  const term = cleanSearch(search);
  if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((item) => ({
    ...normalizeProduct(item),
    category: item.product_categories || null,
    tiers: (item.product_price_tiers || [])
      .map(normalizeTier)
      .sort((a, b) => a.min_quantity - b.min_quantity),
  }));
}

export async function saveProduct(workspaceId, productId, product, tiers = []) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("save_product_with_tiers", {
      p_workspace_id: workspaceId,
      p_product_id: productId || null,
      p_payload: {
        ...normalizeProduct(product),
        category_id: product.category_id || null,
        default_material_id: product.default_material_id || null,
      },
      p_tiers: tiers.map(normalizeTier),
    });

  if (error) throw error;
  return data;
}

export async function setProductActive(productId, active) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("products")
    .update({ active: Boolean(active) })
    .eq("id", productId)
    .select("id,active")
    .single();

  if (error) throw error;
  return data;
}

export async function duplicateProduct(productId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("duplicate_product", { p_product_id: productId });

  if (error) throw error;
  return data;
}
