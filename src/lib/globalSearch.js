export const GLOBAL_SEARCH_TYPES = Object.freeze({
  client: { label: "Cliente", path: "/cadastros/clientes" },
  quote: { label: "Orçamento", path: "/orcamentos" },
  work_order: { label: "A Fazer", path: "/a-fazer" },
  delivered: { label: "Entregue", path: "/entregues" },
  product: { label: "Produto/Serviço", path: "/cadastros/produtos" },
  material: { label: "Material", path: "/cadastros/materiais" },
  vehicle: { label: "Veículo", path: "/cadastros/envelopamento" },
});

export function globalSearchTypeLabel(type) {
  return GLOBAL_SEARCH_TYPES[type]?.label || type;
}

export function globalSearchPath(result) {
  if (result.type === "quote") return `/orcamentos/${result.id}`;
  if (result.type === "work_order" || result.type === "delivered") {
    return result.quote_id ? `/orcamentos/${result.quote_id}` : GLOBAL_SEARCH_TYPES[result.type].path;
  }
  return GLOBAL_SEARCH_TYPES[result.type]?.path || "/";
}

export function rankGlobalSearchResult(result, term) {
  const clean = String(term || "").trim().toLowerCase();
  if (!clean) return 0;

  const title = String(result.title || "").toLowerCase();
  const subtitle = String(result.subtitle || "").toLowerCase();

  if (title === clean) return 100;
  if (title.startsWith(clean)) return 80;
  if (title.includes(clean)) return 60;
  if (subtitle.includes(clean)) return 30;
  return 10;
}
