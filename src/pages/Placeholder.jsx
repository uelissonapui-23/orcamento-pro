export default function Placeholder({ title }) {
  return (
    <section>
      <div className="page-heading"><div><p className="eyebrow">MÓDULO PREPARADO</p><h1>{title}</h1><p>A estrutura de navegação está pronta. Este módulo será concluído na fase correspondente do Plano Mestre.</p></div></div>
      <article className="panel"><div className="empty-state"><strong>{title}</strong><span>Sem implementação provisória: construiremos esta área já com as funções finais previstas.</span></div></article>
    </section>
  );
}
