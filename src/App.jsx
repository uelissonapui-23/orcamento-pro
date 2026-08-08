import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute";
import AppShell from "./components/layout/AppShell";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import SignUp from "./pages/auth/SignUp";
import Home from "./pages/Home";
import Placeholder from "./pages/Placeholder";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
import Materials from "./pages/Materials";
import Vehicles from "./pages/Vehicles";
import Quotes from "./pages/Quotes";
import QuoteEditor from "./pages/QuoteEditor";
import QuotePdf from "./pages/QuotePdf";
import WorkOrders from "./pages/WorkOrders";
import Delivered from "./pages/Delivered";
import Automations from "./pages/Automations";
import RegistrationsLayout from "./components/registrations/RegistrationsLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/criar-conta" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
      <Route path="/esqueci-senha" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="/orcamentos" element={<Quotes />} />
        <Route path="/orcamentos/novo" element={<QuoteEditor />} />
        <Route path="/orcamentos/:quoteId/pdf" element={<QuotePdf />} />
        <Route path="/orcamentos/:quoteId" element={<QuoteEditor />} />
        <Route path="/a-fazer" element={<WorkOrders />} />
        <Route path="/entregues" element={<Delivered />} />
        <Route path="/automacoes" element={<Automations />} />
        <Route path="/cadastros" element={<RegistrationsLayout />}>
          <Route index element={<Navigate to="clientes" replace />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="produtos" element={<Products />} />
          <Route path="materiais" element={<Materials />} />
          <Route path="envelopamento" element={<Vehicles />} />
        </Route>
        <Route path="/configuracoes" element={<Settings />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
