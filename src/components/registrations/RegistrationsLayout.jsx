import { Boxes, CarFront, PackageSearch, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  ["/cadastros/clientes", "Clientes", Users, false],
  ["/cadastros/produtos", "Produtos e Serviços", Boxes, false],
  ["/cadastros/materiais", "Materiais", PackageSearch, true],
  ["/cadastros/envelopamento", "Envelopamento", CarFront, true],
];

export default function RegistrationsLayout() {
  return (
    <section>
      <div className="page-heading registrations-heading">
        <div>
          <p className="eyebrow">CADASTROS</p>
          <h1>Cadastros</h1>
          <p>Configure uma vez e reutilize nos orçamentos.</p>
        </div>
      </div>

      <nav className="registrations-tabs" aria-label="Cadastros">
        {tabs.map(([to, label, Icon, pending]) =>
          pending ? (
            <span className="registration-tab disabled" key={to} title="Será concluído na fase correspondente">
              <Icon size={17} />
              <span>{label}</span>
            </span>
          ) : (
            <NavLink className={({ isActive }) => `registration-tab ${isActive ? "active" : ""}`} key={to} to={to}>
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ),
        )}
      </nav>

      <Outlet />
    </section>
  );
}
