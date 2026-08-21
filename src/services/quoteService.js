import { normalizeQuote, quoteSearchText } from "../lib/quote";
import { supabase } from "../lib/supabase";

function requireClient() {
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}

export async function listQuotes(
  workspaceId,
  { limit = 100, status = "all", search = "" } = {},
) {
  const client = requireClient();

  let query = client
    .schema("orcamento_app")
    .from("quotes")
    .select("id,workspace_id,quote_number,status,client_id,client_snapshot_json,business_snapshot_json,issue_date,valid_until,expected_delivery_date,total,created_at,updated_at,client:clients(id,name,trade_name,document,phone,whatsapp,email)")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;

  const term = String(search || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const normalized = (data || []).map((item) => normalizeQuote({
    ...item,
    client: item.client || null,
    client_snapshot_json: {
      ...(item.client_snapshot_json || {}),
      ...(item.client || {}),
    },
  }));

  if (!term) return normalized;

  const words = term.split(/\s+/).filter(Boolean);
  return normalized.filter((quote) => {
    const haystack = quoteSearchText(quote);
    return words.every((word) => haystack.includes(word));
  });
}

export async function getQuote(workspaceId, quoteId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .from("quotes")
    .select("*, quote_items(*)")
    .eq("workspace_id", workspaceId)
    .eq("id", quoteId)
    .single();

  if (error) throw error;

  return normalizeQuote({
    ...data,
    items: (data.quote_items || []).sort((a, b) => a.sort_order - b.sort_order),
  });
}

export async function saveQuote(workspaceId, quote) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("save_quote_with_items", {
      p_workspace_id: workspaceId,
      p_quote_id: quote.id || null,
      p_payload: {
        status: quote.status,
        client_id: quote.client_id,
        client_snapshot_json: quote.client_snapshot_json,
        business_snapshot_json: quote.business_snapshot_json || {},
        issue_date: quote.issue_date,
        valid_until: quote.valid_until,
        expected_delivery_date: quote.expected_delivery_date || null,
        payment_terms_snapshot: quote.payment_terms_snapshot || "",
        message_snapshot: quote.message_snapshot || "",
        notes_snapshot: quote.notes_snapshot || "",
        terms_snapshot: quote.terms_snapshot || "",
        discount_type: quote.discount_type,
        discount_value: Number(quote.discount_value || 0),
        surcharge_value: Number(quote.surcharge_value || 0),
        subtotal: Number(quote.subtotal || 0),
        discount_total: Number(quote.discount_total || 0),
        surcharge_total: Number(quote.surcharge_total || 0),
        total: Number(quote.total || 0),
      },
      p_items: (quote.items || []).map((item, index) => ({
        product_id: item.product_id || null,
        item_type: item.item_type || "product",
        description: item.description,
        quantity: Number(item.quantity || 1),
        width: item.width,
        height: item.height,
        area: item.area,
        linear_meters: item.linear_meters,
        unit_price: Number(item.unit_price || 0),
        total_price: Number(item.total_price || 0),
        calculation_mode: item.calculation_mode,
        calculation_input_json: item.calculation_input_json || {},
        calculation_snapshot_json: item.calculation_snapshot_json || {},
        notes: item.notes || "",
        sort_order: index,
      })),
    });

  if (error) throw error;

  const quoteId = typeof data === "string" ? data : data?.id || quote.id;
  return getQuote(workspaceId, quoteId);
}


export async function duplicateQuote(workspaceId, quoteId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("duplicate_quote", {
      p_workspace_id: workspaceId,
      p_quote_id: quoteId,
    });

  if (error) throw error;
  return data;
}

export async function cancelQuote(workspaceId, quoteId, reason = "") {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("cancel_quote", {
      p_workspace_id: workspaceId,
      p_quote_id: quoteId,
      p_reason: String(reason || "").trim(),
    });

  if (error) throw error;
  return data;
}

export async function reopenQuote(workspaceId, quoteId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("reopen_quote", {
      p_workspace_id: workspaceId,
      p_quote_id: quoteId,
    });

  if (error) throw error;
  return data;
}


export async function approveQuote(workspaceId, quoteId) {
  const client = requireClient();

  const { data, error } = await client
    .schema("orcamento_app")
    .rpc("approve_quote_and_create_work_order", {
      p_workspace_id: workspaceId,
      p_quote_id: quoteId,
    });

  if (error) throw error;
  return data;
}
