import { FileText, ClipboardList, CheckCircle2, Clock3, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  ["Aguardando resposta", "0", Clock3],
  ["A fazer", "0", ClipboardList],
  ["Entregues este mês", "0", CheckCircle2]
];

export default function Home() {
  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">VISÃO GERAL</p><h1>Bom dia</h1><p>Orçamentos e serviços importantes em um só lugar.</p></div>
        <Link className="primary-button" to="/orcamentos/novo"><Plus size={19} /> Novo orçamento</Link>
      </div>

      <div className="metric-grid">
        {cards.map(([label, value, Icon]) => (
          <article className="metric-card" key={label}>
            <div className="metric-icon"><Icon size={20} /></div>
            <div><span>{label}</span><strong>{value}</strong></div>
          </article>
        ))}
      </div>

      <article className="panel">
        <div className="panel-title"><div><h2>Próximos serviços</h2><p>Os mais urgentes aparecerão primeiro automaticamente.</p></div></div>
        <div className="empty-state"><FileText size={32} /><strong>Nenhum serviço ainda</strong><span>Quando um orçamento for aprovado, ele aparecerá aqui.</span></div>
      </article>
    </section>
  );
}
