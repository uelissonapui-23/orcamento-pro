import { Link } from "react-router-dom";

export default function AuthLayout({ title, description, children, footer }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link to="/" className="auth-brand" aria-label="Orçamento App">
          <span className="brand-mark">O</span>
          <span>
            <strong>Orçamento App</strong>
            <small>simples, rápido e organizado</small>
          </span>
        </Link>

        <div className="auth-copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        {children}

        {footer ? <div className="auth-footer">{footer}</div> : null}
      </section>

      <aside className="auth-hero" aria-hidden="true">
        <div className="auth-hero-content">
          <span className="auth-pill">ORÇAMENTO → A FAZER → ENTREGUE</span>
          <h2>Menos conta manual. Mais clareza no que precisa ser feito.</h2>
          <p>Os módulos serão construídos para automatizar tarefas repetitivas sem complicar o uso diário.</p>
        </div>
      </aside>
    </main>
  );
}
