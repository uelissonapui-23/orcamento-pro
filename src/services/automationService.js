import { supabase } from "../lib/supabase";

function client() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

export async function getAutomationSettings(workspaceId) {
  const db=client();
  const { data, error } = await db.schema("orcamento_app").from("automation_settings")
    .select("*").eq("workspace_id",workspaceId).maybeSingle();
  if(error) throw error;
  return data || {
    workspace_id:workspaceId, quote_followup_days:3, quote_expiry_warning_days:2,
    delivery_warning_days:2, show_safe_suggestions:true,
    default_whatsapp_message:"Olá, {cliente}! Estou entrando em contato sobre o orçamento #{numero}."
  };
}

export async function saveAutomationSettings(workspaceId, settings) {
  const db=client();
  const { data,error }=await db.schema("orcamento_app").from("automation_settings")
    .upsert({...settings,workspace_id:workspaceId},{onConflict:"workspace_id"}).select().single();
  if(error) throw error; return data;
}

export async function listQuoteTemplates(workspaceId) {
  const db=client();
  const {data,error}=await db.schema("orcamento_app").from("quote_templates").select("*")
    .eq("workspace_id",workspaceId).order("is_favorite",{ascending:false})
    .order("use_count",{ascending:false}).order("updated_at",{ascending:false});
  if(error) throw error; return data||[];
}

export async function saveQuoteTemplate(workspaceId, template) {
  const db=client();
  const payload={...template,workspace_id:workspaceId};
  const q=template.id
    ? db.schema("orcamento_app").from("quote_templates").update(payload).eq("id",template.id).eq("workspace_id",workspaceId)
    : db.schema("orcamento_app").from("quote_templates").insert(payload);
  const {data,error}=await q.select().single(); if(error) throw error; return data;
}

export async function deleteQuoteTemplate(workspaceId,id) {
  const {error}=await client().schema("orcamento_app").from("quote_templates")
    .delete().eq("workspace_id",workspaceId).eq("id",id);
  if(error) throw error;
}

export async function toggleTemplateFavorite(workspaceId,template) {
  return saveQuoteTemplate(workspaceId,{...template,is_favorite:!template.is_favorite});
}

export async function getAutomationSuggestions(workspaceId, settings) {
  const db=client();
  const now=new Date();
  const today=now.toISOString().slice(0,10);
  const followupCutoff=new Date(now.getTime()-Number(settings.quote_followup_days||3)*86400000).toISOString();
  const expiryLimit=new Date(now.getTime()+Number(settings.quote_expiry_warning_days||2)*86400000).toISOString().slice(0,10);
  const deliveryLimit=new Date(now.getTime()+Number(settings.delivery_warning_days||2)*86400000).toISOString().slice(0,10);

  const [follow,expiring,deliveries,recent]=await Promise.all([
    db.schema("orcamento_app").from("quotes").select("id,quote_number,client_snapshot_json,updated_at")
      .eq("workspace_id",workspaceId).eq("status","awaiting_response").lte("updated_at",followupCutoff).order("updated_at").limit(8),
    db.schema("orcamento_app").from("quotes").select("id,quote_number,client_snapshot_json,valid_until")
      .eq("workspace_id",workspaceId).eq("status","awaiting_response").gte("valid_until",today).lte("valid_until",expiryLimit).order("valid_until").limit(8),
    db.schema("orcamento_app").from("work_orders").select("id,quote_id,quote_number,client_snapshot_json,due_date,status")
      .eq("workspace_id",workspaceId).in("status",["pending","in_progress","ready"]).lte("due_date",deliveryLimit).order("due_date").limit(8),
    db.schema("orcamento_app").from("quotes").select("id,quote_number,client_snapshot_json,status,updated_at")
      .eq("workspace_id",workspaceId).order("updated_at",{ascending:false}).limit(6)
  ]);
  for(const r of [follow,expiring,deliveries,recent]) if(r.error) throw r.error;
  return {followups:follow.data||[],expiring:expiring.data||[],deliveries:deliveries.data||[],recent:recent.data||[]};
}

export function renderAutomationMessage(template, item) {
  return String(template||"")
    .replaceAll("{cliente}",item?.client_snapshot_json?.name||"cliente")
    .replaceAll("{numero}",String(item?.quote_number||"").padStart(4,"0"));
}
