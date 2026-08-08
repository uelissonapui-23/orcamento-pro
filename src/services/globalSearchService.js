import { rankGlobalSearchResult } from "../lib/globalSearch";
import { listClients } from "./clientService";
import { listMaterials } from "./materialService";
import { listProducts } from "./productService";
import { listQuotes } from "./quoteService";
import {
  listDeliveredWorkOrders,
  listWorkOrders,
} from "./workOrderService";
import { listVehicleModels } from "./vehicleService";

function numberLabel(value) {
  return `#${String(value || 0).padStart(4, "0")}`;
}

function quoteStatusLabel(status) {
  const labels = {
    draft: "Rascunho",
    awaiting_response: "Aguardando resposta",
    approved: "Aprovado",
    cancelled: "Cancelado",
  };
  return labels[status] || status || "";
}

function workStatusLabel(status) {
  const labels = {
    pending: "A fazer",
    in_progress: "Em produção",
    ready: "Pronto",
    delivered: "Entregue",
  };
  return labels[status] || status || "";
}

export async function globalSearch(workspaceId, term, { limitPerType = 8 } = {}) {
  const clean = String(term || "").trim();
  if (clean.length < 2) return [];

  const [
    clients,
    quotes,
    openOrders,
    delivered,
    products,
    materials,
    vehicles,
  ] = await Promise.all([
    listClients(workspaceId, { search: clean, status: "all", limit: limitPerType }),
    listQuotes(workspaceId, { search: clean, status: "all", limit: 80 }),
    listWorkOrders(workspaceId, { status: "open", limit: 80 }),
    listDeliveredWorkOrders(workspaceId, { search: clean, limit: 80 }),
    listProducts(workspaceId, { search: clean, status: "all" }),
    listMaterials(workspaceId, { search: clean, status: "all" }),
    listVehicleModels(workspaceId, { search: clean, status: "all" }),
  ]);

  const normalizedTerm = clean.toLowerCase();

  const results = [
    ...clients.slice(0, limitPerType).map((client) => ({
      type: "client",
      id: client.id,
      title: client.name,
      subtitle: [
        client.trade_name,
        client.document,
        client.phone || client.whatsapp,
      ].filter(Boolean).join(" · "),
      search_hint: clean,
    })),

    ...quotes.slice(0, limitPerType).map((quote) => ({
      type: "quote",
      id: quote.id,
      title: `${numberLabel(quote.quote_number)} · ${quote.client_snapshot_json?.name || "Cliente"}`,
      subtitle: `${quoteStatusLabel(quote.status)} · R$ ${Number(quote.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      quote_number: quote.quote_number,
      status: quote.status,
      duplicate_id: quote.id,
    })),

    ...openOrders
      .filter((order) => {
        const haystack = [
          order.quote_number,
          order.client_snapshot_json?.name,
          order.client_snapshot_json?.trade_name,
          order.client_snapshot_json?.document,
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(normalizedTerm);
      })
      .slice(0, limitPerType)
      .map((order) => ({
        type: "work_order",
        id: order.id,
        quote_id: order.quote_id,
        title: `${numberLabel(order.quote_number)} · ${order.client_snapshot_json?.name || "Cliente"}`,
        subtitle: `${workStatusLabel(order.status)}${order.due_date ? ` · prazo ${new Date(`${order.due_date}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}`,
        duplicate_id: order.quote_id,
      })),

    ...delivered.slice(0, limitPerType).map((order) => ({
      type: "delivered",
      id: order.id,
      quote_id: order.quote_id,
      title: `${numberLabel(order.quote_number)} · ${order.client_snapshot_json?.name || "Cliente"}`,
      subtitle: `Entregue${order.delivered_at ? ` em ${new Date(order.delivered_at).toLocaleDateString("pt-BR")}` : ""}`,
      duplicate_id: order.quote_id,
    })),

    ...products.slice(0, limitPerType).map((product) => ({
      type: "product",
      id: product.id,
      title: product.name,
      subtitle: [product.category?.name, product.calculation_mode].filter(Boolean).join(" · "),
      duplicate_id: product.id,
      search_hint: clean,
    })),

    ...materials.slice(0, limitPerType).map((material) => ({
      type: "material",
      id: material.id,
      title: material.name,
      subtitle: [material.category?.name, material.unit].filter(Boolean).join(" · "),
      duplicate_id: material.id,
      search_hint: clean,
    })),

    ...vehicles.slice(0, limitPerType).map((vehicle) => ({
      type: "vehicle",
      id: vehicle.id,
      title: [vehicle.brand, vehicle.model, vehicle.year_from].filter(Boolean).join(" "),
      subtitle: `${vehicle.type?.name || "Veículo"} · ${(vehicle.parts || []).length} peça(s)`,
      duplicate_id: vehicle.id,
      search_hint: clean,
    })),
  ];

  return results
    .map((result) => ({
      ...result,
      rank: rankGlobalSearchResult(result, clean),
    }))
    .sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title, "pt-BR"))
    .slice(0, 40);
}
