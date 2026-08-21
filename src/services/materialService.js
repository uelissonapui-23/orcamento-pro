import { normalizeMaterial } from "../lib/material";
import { supabase } from "../lib/supabase";

const BUCKET = "orcamento-app-assets";
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

function extensionFor(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export function validateMaterialImage(file) {
  if (!file) throw new Error("Selecione uma imagem.");
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Use PNG, JPG ou WebP.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("A imagem deve ter no máximo 2 MB.");
}

export async function createMaterialImageUrl(path) {
  if (!path) return "";
  const client = requireClient();
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadMaterialImage(workspaceId, materialId, file, previousPath = "") {
  validateMaterialImage(file);
  const client = requireClient();
  const path = `${workspaceId}/materials/${materialId}/material-${Date.now()}.${extensionFor(file)}`;
  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;
  const { data, error: updateError } = await client.schema("orcamento_app").from("materials").update({ image_path: path }).eq("id", materialId).eq("workspace_id", workspaceId).select("image_path").single();
  if (updateError) { await client.storage.from(BUCKET).remove([path]); throw updateError; }
  if (previousPath && previousPath !== path) await client.storage.from(BUCKET).remove([previousPath]);
  return data.image_path;
}

export async function removeMaterialImage(workspaceId, materialId, path) {
  const client = requireClient();
  const { error } = await client.schema("orcamento_app").from("materials").update({ image_path: null }).eq("id", materialId).eq("workspace_id", workspaceId);
  if (error) throw error;
  if (path) { const { error: removeError } = await client.storage.from(BUCKET).remove([path]); if (removeError) throw removeError; }
}

function cleanSearch(value) {
  return String(value || "").trim().replace(/[%_,()]/g, " ");
}

export function buildMaterialPayload(values, { workspaceId } = {}) {
  const material = normalizeMaterial(values);
  return {
    ...(workspaceId ? { workspace_id: workspaceId } : {}),
    category_id: material.category_id || null,
    name: material.name,
    unit: material.unit,
    roll_width: material.roll_width === "" ? null : material.roll_width,
    cost_value: material.cost_value === "" ? null : material.cost_value,
    sale_value: material.sale_value === "" ? null : material.sale_value,
    wrapping_multiplier: material.wrapping_multiplier === "" ? 1 : material.wrapping_multiplier,
    wrapping_discount_percent: material.wrapping_discount_percent === "" ? 0 : material.wrapping_discount_percent,
    image_path: material.image_path || null,
    use_in_wrapping: material.use_in_wrapping,
    notes: material.notes || null,
    active: material.active,
  };
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

  const { data, error } = await client
    .schema("orcamento_app")
    .from("materials")
    .insert(buildMaterialPayload(values, { workspaceId }))
    .select("*")
    .single();

  if (error) throw error;
  return normalizeMaterial(data);
}

export async function updateMaterial(materialId, values) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("materials")
    .update(buildMaterialPayload(values))
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
