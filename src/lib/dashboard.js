export function dashboardPriorityLabel(counts = {}) {
  if (counts.overdue > 0) return `${counts.overdue} serviço(s) atrasado(s)`;
  if (counts.dueSoon > 0) return `${counts.dueSoon} entrega(s) próxima(s)`;
  if (counts.awaiting > 0) return `${counts.awaiting} orçamento(s) aguardando resposta`;
  return "Tudo em ordem por enquanto";
}

export function dashboardPriorityTone(counts = {}) {
  if (counts.overdue > 0) return "danger";
  if (counts.dueSoon > 0) return "warning";
  return "normal";
}
