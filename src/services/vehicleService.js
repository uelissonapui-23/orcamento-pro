import {
  normalizeVehicleModel,
  normalizeVehiclePart,
} from "../lib/vehicle";
import { supabase } from "../lib/supabase";

const BUCKET = "orcamento-app-assets";
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

function cleanSearch(value) {
  return String(value || "").trim().replace(/[%_,()]/g, " ");
}

function extensionFor(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export function validateVehicleImage(file) {
  if (!file) throw new Error("Selecione uma imagem.");
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Use PNG, JPG ou WebP.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("A imagem deve ter no máximo 3 MB.");
}

export async function createVehicleImageUrl(path) {
  if (!path) return "";
  const client = requireClient();
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadVehicleImage(workspaceId, modelId, file, previousPath = "") {
  validateVehicleImage(file);
  const client = requireClient();
  const path = `${workspaceId}/vehicles/${modelId}/model-${Date.now()}.${extensionFor(file)}`;

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data, error: updateError } = await client
    .schema("orcamento_app")
    .from("vehicle_models")
    .update({ image_path: path })
    .eq("id", modelId)
    .eq("workspace_id", workspaceId)
    .select("image_path")
    .single();

  if (updateError) {
    await client.storage.from(BUCKET).remove([path]);
    throw updateError;
  }

  if (previousPath && previousPath !== path) {
    await client.storage.from(BUCKET).remove([previousPath]);
  }

  return data.image_path;
}

export async function removeVehicleImage(workspaceId, modelId, path) {
  const client = requireClient();

  const { error } = await client
    .schema("orcamento_app")
    .from("vehicle_models")
    .update({ image_path: null })
    .eq("id", modelId)
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  if (path) {
    const { error: removeError } = await client.storage.from(BUCKET).remove([path]);
    if (removeError) throw removeError;
  }
}

export async function listVehicleTypes(workspaceId, { includeInactive = false } = {}) {
  const client = requireClient();
  let query = client
    .schema("orcamento_app")
    .from("vehicle_types")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createVehicleType(workspaceId, name) {
  const client = requireClient();
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Informe o tipo de veículo.");

  const { data, error } = await client
    .schema("orcamento_app")
    .from("vehicle_types")
    .insert({ workspace_id: workspaceId, name: cleanName })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateVehicleType(typeId, values) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("vehicle_types")
    .update(values)
    .eq("id", typeId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listVehicleModels(
  workspaceId,
  { search = "", status = "active", typeId = "" } = {},
) {
  const client = requireClient();
  let query = client
    .schema("orcamento_app")
    .from("vehicle_models")
    .select("*, vehicle_types(id,name), vehicle_parts(*)")
    .eq("workspace_id", workspaceId)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });

  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);
  if (typeId) query = query.eq("vehicle_type_id", typeId);

  const term = cleanSearch(search);
  if (term) query = query.or(`brand.ilike.%${term}%,model.ilike.%${term}%,notes.ilike.%${term}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((item) => ({
    ...normalizeVehicleModel(item),
    type: item.vehicle_types || null,
    parts: (item.vehicle_parts || [])
      .map(normalizeVehiclePart)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
  }));
}

export async function saveVehicleModel(workspaceId, modelId, model, parts = []) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("save_vehicle_model_with_parts", {
      p_workspace_id: workspaceId,
      p_model_id: modelId || null,
      p_payload: normalizeVehicleModel(model),
      p_parts: parts.map(normalizeVehiclePart),
    });

  if (error) throw error;
  return data;
}

export async function setVehicleModelActive(modelId, active) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("vehicle_models")
    .update({ active: Boolean(active) })
    .eq("id", modelId)
    .select("id,active")
    .single();

  if (error) throw error;
  return data;
}

export async function duplicateVehicleModel(modelId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("duplicate_vehicle_model", { p_model_id: modelId });

  if (error) throw error;
  return data;
}

export async function copyVehicleParts(sourceModelId, targetModelId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("copy_vehicle_parts", {
      p_source_model_id: sourceModelId,
      p_target_model_id: targetModelId,
    });

  if (error) throw error;
  return data;
}
