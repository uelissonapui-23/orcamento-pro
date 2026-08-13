import { normalizeBusinessSettings } from "../lib/businessSettings";
import { supabase } from "../lib/supabase";

const BUCKET = "orcamento-app-assets";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const PDF_LOGO_MAX_WIDTH = 640;
const PDF_LOGO_MAX_HEIGHT = 240;
const PDF_LOGO_QUALITY = 0.72;

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

function extensionFor(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function loadLocalImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível processar a logo para o PDF."));
    };
    image.src = url;
  });
}

function canvasToWebp(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível criar a versão leve da logo."));
      },
      "image/webp",
      PDF_LOGO_QUALITY,
    );
  });
}

export async function createPdfLogoBlob(file) {
  validateLogoFile(file);
  const image = await loadLocalImage(file);
  const ratio = Math.min(
    1,
    PDF_LOGO_MAX_WIDTH / Math.max(1, image.naturalWidth),
    PDF_LOGO_MAX_HEIGHT / Math.max(1, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);
  return canvasToWebp(canvas);
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
  const stamp = Date.now();
  const path = `${workspaceId}/logos/logo-${stamp}.${extensionFor(file)}`;
  const pdfPath = `${workspaceId}/logos/pdf/logo-pdf-${stamp}.webp`;
  const pdfLogoBlob = await createPdfLogoBlob(file);

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { error: pdfUploadError } = await client.storage
    .from(BUCKET)
    .upload(pdfPath, pdfLogoBlob, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: false,
    });

  if (pdfUploadError) {
    await client.storage.from(BUCKET).remove([path]);
    throw pdfUploadError;
  }

  const { data, error: updateError } = await client
    .schema("orcamento_app")
    .from("business_settings")
    .update({ logo_path: path, pdf_logo_path: pdfPath })
    .eq("workspace_id", workspaceId)
    .select("logo_path,pdf_logo_path")
    .single();

  if (updateError) {
    await client.storage.from(BUCKET).remove([path, pdfPath]);
    throw updateError;
  }

  // Não apagamos arquivos anteriores: orçamentos já emitidos podem guardar
  // esses caminhos no snapshot histórico do PDF.
  void previousPath;

  return { logo_path: data.logo_path, pdf_logo_path: data.pdf_logo_path };
}

export async function removeBusinessLogo(workspaceId, previousPath) {
  const client = requireClient();

  const { error: updateError } = await client
    .schema("orcamento_app")
    .from("business_settings")
    .update({ logo_path: null, pdf_logo_path: null })
    .eq("workspace_id", workspaceId);

  if (updateError) throw updateError;

  // Mantemos o arquivo no Storage para preservar PDFs históricos que
  // referenciam esse logo_path. Apenas o vínculo atual é removido.
  void previousPath;
}
