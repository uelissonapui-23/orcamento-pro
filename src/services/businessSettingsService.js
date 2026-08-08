import { normalizeBusinessSettings } from "../lib/businessSettings";
import { supabase } from "../lib/supabase";

const BUCKET = "orcamento-app-assets";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

function extensionFor(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function loadBusinessSettings(workspaceId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("business_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  if (error) throw error;
  return normalizeBusinessSettings(data);
}

export async function saveBusinessSettings(workspaceId, values) {
  const client = requireClient();
  const normalized = normalizeBusinessSettings(values);

  const payload = {
    workspace_id: workspaceId,
    ...normalized,
    logo_path: normalized.logo_path || null,
  };

  const { data, error } = await client
    .schema("orcamento_app")
    .from("business_settings")
    .upsert(payload, { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (error) throw error;
  return normalizeBusinessSettings(data);
}

export function validateLogoFile(file) {
  if (!file) throw new Error("Selecione uma imagem.");
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error("Use uma imagem PNG, JPG ou WebP.");
  }
  if (file.size > MAX_LOGO_SIZE) {
    throw new Error("A logo deve ter no máximo 2 MB.");
  }
}

export async function createLogoPreviewUrl(path) {
  if (!path) return "";
  const client = requireClient();

  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function uploadBusinessLogo(workspaceId, file, previousPath = "") {
  validateLogoFile(file);
  const client = requireClient();

  const path = `${workspaceId}/logos/logo-${Date.now()}.${extensionFor(file)}`;

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error: updateError } = await client
    .schema("orcamento_app")
    .from("business_settings")
    .update({ logo_path: path })
    .eq("workspace_id", workspaceId)
    .select("logo_path")
    .single();

  if (updateError) {
    await client.storage.from(BUCKET).remove([path]);
    throw updateError;
  }

  if (previousPath && previousPath !== path) {
    await client.storage.from(BUCKET).remove([previousPath]);
  }

  return data.logo_path;
}

export async function removeBusinessLogo(workspaceId, previousPath) {
  const client = requireClient();

  const { error: updateError } = await client
    .schema("orcamento_app")
    .from("business_settings")
    .update({ logo_path: null })
    .eq("workspace_id", workspaceId);

  if (updateError) throw updateError;

  if (previousPath) {
    const { error: removeError } = await client.storage
      .from(BUCKET)
      .remove([previousPath]);

    if (removeError) throw removeError;
  }
}
