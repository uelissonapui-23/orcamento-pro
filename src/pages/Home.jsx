import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  PackageCheck,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { dashboardPriorityLabel, dashboardPriorityTone } from "../lib/dashboard";
import { formatBRL } from "../lib/money";
import { loadDashboard } from "../services/dashboardService";

function dateLabel(value) {
  if (!value) return "Sem prazo";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function Home() {
  const { workspace } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setError("");

    try {
      setData(await loadDashboard(workspace.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <section className="home-loading">
        <div className="spinner" />
        <strong>Preparando seu painel...</strong>
      </section>
    );
  }

  const counts = data?.counts || {
    awaiting: 0,
    open: 0,
    overdue: 0,
    dueSoon: 0,
    deliveredToday: 0,
  };

  const priorityTone = dashboardPriorityTone(counts);

  return (
    <section className="home-final">
      <div className="home-final-heading">
        <div>
          <p className="eyebrow">VISÃO GERAL</p>
          <h1>Início</h1>
          <p>O que precisa da sua atenção agora.</p>
        </div>

        <Link className="primary-button" to="/orcamentos/novo">
          <Plus size={19} /> Novo orçamento
        </Link>
      </div>

      {error ? <div className="form-alert error">{error}</div> : null}

      <div className={`home-priority ${priorityTone}`}>
        <div className="home-priority-icon">
          {priorityTone === "danger" ? <AlertTriangle size={22} /> :
           priorityTone === "warning" ? <CalendarClock size={22} /> :
           <CheckCircle2 size={22} />}
        </div>

        <div>
          <strong>{dashboardPriorityLabel(counts)}</strong>
          <span>
            {priorityTone === "danger"
              ? "Resolva os atrasados primeiro para evitar acúmulo."
              : priorityTone === "warning"
                ? "Existem entregas próximas que merecem atenção."
                : "Você pode seguir com novos orçamentos e produção normalmente."}
          </span>
        </div>

        <Link to="/a-fazer">
          Ver A Fazer <ArrowRight size={15} />
        </Link>
      </div>

      <div className="home-metrics">
        <Link className="home-metric-card awaiting" to="/orcamentos">
          <div><FileText size={19} /></div>
          <span>Aguardando resposta</span>
          <strong>{counts.awaiting}</strong>
        </Link>

        <Link className="home-metric-card open" to="/a-fazer">
          <div><PackageCheck size={19} /></div>
          <span>Em aberto</span>
          <strong>{counts.open}</strong>
        </Link>

        <Link className="home-metric-card overdue" to="/a-fazer">
          <div><AlertTriangle size={19} /></div>
          <span>Atrasados</span>
          <strong>{counts.overdue}</strong>
        </Link>

        <Link className="home-metric-card soon" to="/a-fazer">
          <div><CalendarClock size={19} /></div>
          <span>Próximos</span>
          <strong>{counts.dueSoon}</strong>
        </Link>

        <Link className="home-metric-card delivered" to="/entregues">
          <div><CheckCircle2 size={19} /></div>
          <span>Entregues hoje</span>
          <strong>{counts.deliveredToday}</strong>
        </Link>
      </div>

      <div className="home-final-grid">
        <section className="home-panel">
          <div className="home-panel-head">
            <div>
              <h2>Atrasados e próximos</h2>
              <p>Já ordenados por prazo.</p>
            </div>
            <Link to="/a-fazer">Abrir A Fazer</Link>
          </div>

          <div className="home-list">
            {[...(data?.overdue || []), ...(data?.dueSoon || [])]
              .slice(0, 6)
              .map((order) => {
                const overdue = (data?.overdue || []).some((item) => item.id === order.id);
                return (
                  <Link className={`home-row ${overdue ? "overdue" : "soon"}`} to="/a-fazer" key={order.id}>
                    <div className="home-row-icon">
                      {overdue ? <AlertTriangle size={16} /> : <Clock3 size={16} />}
                    </div>
                    <div className="home-row-copy">
                      <strong>#{String(order.quote_number).padStart(4, "0")} · {order.client_snapshot_json?.name || "Cliente"}</strong>
                      <span>{overdue ? "Atrasado" : "Próximo"} · prazo {dateLabel(order.due_date)}</span>
                    </div>
                    <b>{formatBRL(order.total)}</b>
                  </Link>
                );
              })}

            {!data?.overdue?.length && !data?.dueSoon?.length ? (
              <div className="home-panel-empty">
                <CheckCircle2 size={22} />
                <strong>Nenhum prazo crítico</strong>
                <span>Os serviços em aberto estão dentro do prazo.</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="home-panel">
          <div className="home-panel-head">
            <div>
              <h2>Aguardando resposta</h2>
              <p>Orçamentos que ainda dependem do cliente.</p>
            </div>
            <Link to="/orcamentos">Ver todos</Link>
          </div>

          <div className="home-list">
            {(data?.awaiting || []).slice(0, 6).map((quote) => (
              <Link className="home-row" to={`/orcamentos/${quote.id}`} key={quote.id}>
                <div className="home-row-icon awaiting">
                  <FileText size={16} />
                </div>
                <div className="home-row-copy">
                  <strong>#{String(quote.quote_number).padStart(4, "0")} · {quote.client_snapshot_json?.name || "Cliente"}</strong>
                  <span>Válido até {dateLabel(quote.valid_until)}</span>
                </div>
                <b>{formatBRL(quote.total)}</b>
              </Link>
            ))}

            {!data?.awaiting?.length ? (
              <div className="home-panel-empty">
                <CheckCircle2 size={22} />
                <strong>Nada aguardando resposta</strong>
                <span>Não há orçamentos pendentes de retorno.</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="home-quick-actions">
        <div>
          <strong>Ações rápidas</strong>
          <span>Atalhos para o que você mais usa.</span>
        </div>

        <div className="home-quick-links">
          <Link to="/orcamentos/novo"><Plus size={17} /> Novo orçamento</Link>
          <Link to="/orcamentos"><FileText size={17} /> Orçamentos</Link>
          <Link to="/a-fazer"><PackageCheck size={17} /> A Fazer</Link>
          <Link to="/entregues"><CheckCircle2 size={17} /> Entregues</Link>
        </div>
      </section>
    </section>
  );
}
