import { normalizeMaterial } from "../lib/material";
import { supabase } from "../lib/supabase";

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

function cleanSearch(value) {
  return String(value || "").trim().replace(/[%_,()]/g, " ");
}

export async function listMaterialCategories(workspaceId, { includeInactive = false } = {}) {
  const client = requireClient();
  let query = client
    .schema("orcamento_app")
    .from("material_categories")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createMaterialCategory(workspaceId, name) {
  const client = requireClient();
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Informe o nome da categoria.");

  const { data, error } = await client
    .schema("orcamento_app")
    .from("material_categories")
    .insert({ workspace_id: workspaceId, name: cleanName })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateMaterialCategory(categoryId, values) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("material_categories")
    .update(values)
    .eq("id", categoryId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listMaterials(
  workspaceId,
  { search = "", status = "active", categoryId = "", wrapping = "all" } = {},
) {
  const client = requireClient();
  let query = client
    .schema("orcamento_app")
    .from("materials")
    .select("*, material_categories(id,name)")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (wrapping === "yes") query = query.eq("use_in_wrapping", true);
  if (wrapping === "no") query = query.eq("use_in_wrapping", false);

  const term = cleanSearch(search);
  if (term) query = query.or(`name.ilike.%${term}%,notes.ilike.%${term}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((item) => ({
    ...normalizeMaterial(item),
    category: item.material_categories || null,
  }));
}

export async function createMaterial(workspaceId, values) {
  const client = requireClient();
  const material = normalizeMaterial(values);

  const { data, error } = await client
    .schema("orcamento_app")
    .from("materials")
    .insert({
      workspace_id: workspaceId,
      ...material,
      category_id: material.category_id || null,
      roll_width: material.roll_width === "" ? null : material.roll_width,
      cost_value: material.cost_value === "" ? null : material.cost_value,
      sale_value: material.sale_value === "" ? null : material.sale_value,
    })
    .select("*")
    .single();

  if (error) throw error;
  return normalizeMaterial(data);
}

export async function updateMaterial(materialId, values) {
  const client = requireClient();
  const material = normalizeMaterial(values);

  const { data, error } = await client
    .schema("orcamento_app")
    .from("materials")
    .update({
      ...material,
      category_id: material.category_id || null,
      roll_width: material.roll_width === "" ? null : material.roll_width,
      cost_value: material.cost_value === "" ? null : material.cost_value,
      sale_value: material.sale_value === "" ? null : material.sale_value,
    })
    .eq("id", materialId)
    .select("*")
    .single();

  if (error) throw error;
  return normalizeMaterial(data);
}

export async function setMaterialActive(materialId, active) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("materials")
    .update({ active: Boolean(active) })
    .eq("id", materialId)
    .select("id,active")
    .single();

  if (error) throw error;
  return data;
}

export async function duplicateMaterial(materialId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("duplicate_material", { p_material_id: materialId });

  if (error) throw error;
  return data;
}
