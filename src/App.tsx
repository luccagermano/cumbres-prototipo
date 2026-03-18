import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/guards/ProtectedRoute";

// Layouts
import PublicLayout from "@/components/layouts/PublicLayout";
import CustomerLayout from "@/components/layouts/CustomerLayout";
import InternalLayout from "@/components/layouts/InternalLayout";
import ExecutiveLayout from "@/components/layouts/ExecutiveLayout";

// Public pages
import SiteHome from "@/pages/site/SiteHome";
import SiteAbout from "@/pages/site/SiteAbout";
import SiteContact from "@/pages/site/SiteContact";
import EmpreendimentosList from "@/pages/empreendimentos/EmpreendimentosList";
import EmpreendimentoMural from "@/pages/empreendimentos/EmpreendimentoMural";
import EmpreendimentoDetail from "@/pages/empreendimentos/EmpreendimentoDetail";
import CampanhaDetail from "@/pages/campanha/CampanhaDetail";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Customer pages
import ClienteDashboard from "@/pages/cliente/ClienteDashboard";
import ClienteUnidade from "@/pages/cliente/ClienteUnidade";
import ClienteFinanceiro from "@/pages/cliente/ClienteFinanceiro";
import ClienteDocumentos from "@/pages/cliente/ClienteDocumentos";
import ClienteDocumentoDetail from "@/pages/cliente/ClienteDocumentoDetail";
import ClienteVistoria from "@/pages/cliente/ClienteVistoria";
import ClienteAssistencia from "@/pages/cliente/ClienteAssistencia";
import ClienteAssistenciaDetail from "@/pages/cliente/ClienteAssistenciaDetail";
import ClienteAjuda from "@/pages/cliente/ClienteAjuda";
import ClienteNotificacoes from "@/pages/cliente/ClienteNotificacoes";
import ClienteCalendario from "@/pages/cliente/ClienteCalendario";
import ClienteAssistente from "@/pages/cliente/ClienteAssistente";

// Internal pages
import InternoDashboard from "@/pages/interno/InternoDashboard";
import InternoChamados from "@/pages/interno/InternoChamados";
import InternoChamadoDetail from "@/pages/interno/InternoChamadoDetail";
import InternoGarantia from "@/pages/interno/InternoGarantia";
import InternoAgenda from "@/pages/interno/InternoAgenda";
import InternoDocumentos from "@/pages/interno/InternoDocumentos";
import InternoFinanceiro from "@/pages/interno/InternoFinanceiro";
import InternoCadastros from "@/pages/interno/InternoCadastros";
import InternoEmpreendimentos from "@/pages/interno/InternoEmpreendimentos";
import InternoBlocos from "@/pages/interno/InternoBlocos";
import InternoUnidades from "@/pages/interno/InternoUnidades";
import InternoClientes from "@/pages/interno/InternoClientes";

// Executive pages
import ExecutivoDashboard from "@/pages/executivo/ExecutivoDashboard";
import ExecutivoAutomacao from "@/pages/executivo/ExecutivoAutomacao";
import InternoContratos from "@/pages/interno/InternoContratos";
import InternoEquipe from "@/pages/interno/InternoEquipe";
import InternoOnboardingCliente from "@/pages/interno/InternoOnboardingCliente";

// Docs
import DocumentacaoPage from "@/pages/documentacao/DocumentacaoPage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/site" replace />} />

            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/site" element={<SiteHome />} />
              <Route path="/site/sobre" element={<SiteAbout />} />
              <Route path="/site/contato" element={<SiteContact />} />
              <Route path="/empreendimentos" element={<EmpreendimentosList />} />
              <Route path="/empreendimentos/mural" element={<EmpreendimentoMural />} />
              <Route path="/empreendimentos/:slug" element={<EmpreendimentoDetail />} />
              <Route path="/campanha/:slug" element={<CampanhaDetail />} />
            </Route>

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer (any authenticated user) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<CustomerLayout />}>
                <Route path="/cliente" element={<ClienteDashboard />} />
                <Route path="/cliente/unidade" element={<ClienteUnidade />} />
                <Route path="/cliente/financeiro" element={<ClienteFinanceiro />} />
                <Route path="/cliente/documentos" element={<ClienteDocumentos />} />
                <Route path="/cliente/documentos/:id" element={<ClienteDocumentoDetail />} />
                <Route path="/cliente/vistoria" element={<ClienteVistoria />} />
                <Route path="/cliente/assistencia" element={<ClienteAssistencia />} />
                <Route path="/cliente/assistencia/:id" element={<ClienteAssistenciaDetail />} />
                <Route path="/cliente/ajuda" element={<ClienteAjuda />} />
                <Route path="/cliente/notificacoes" element={<ClienteNotificacoes />} />
                <Route path="/cliente/calendario" element={<ClienteCalendario />} />
                <Route path="/cliente/assistente" element={<ClienteAssistente />} />
              </Route>
            </Route>

            {/* Internal (staff roles) */}
            <Route element={<ProtectedRoute allowedRoles={["org_admin", "finance_agent", "support_agent", "inspection_agent", "document_agent"]} />}>
              <Route element={<InternalLayout />}>
                <Route path="/interno" element={<InternoDashboard />} />
                <Route path="/interno/cadastros" element={<InternoCadastros />} />
                <Route path="/interno/cadastros/empreendimentos" element={<InternoEmpreendimentos />} />
                <Route path="/interno/cadastros/blocos" element={<InternoBlocos />} />
                <Route path="/interno/cadastros/unidades" element={<InternoUnidades />} />
                <Route path="/interno/cadastros/clientes" element={<InternoClientes />} />
                <Route path="/interno/cadastros/contratos" element={<InternoContratos />} />
                <Route path="/interno/cadastros/equipe" element={<InternoEquipe />} />
                <Route path="/interno/chamados" element={<InternoChamados />} />
                <Route path="/interno/chamados/:id" element={<InternoChamadoDetail />} />
                <Route path="/interno/garantia" element={<InternoGarantia />} />
                <Route path="/interno/agenda" element={<InternoAgenda />} />
                <Route path="/interno/documentos" element={<InternoDocumentos />} />
                <Route path="/interno/financeiro" element={<InternoFinanceiro />} />
              </Route>
            </Route>

            {/* Executive */}
            <Route element={<ProtectedRoute allowedRoles={["org_admin", "executive_viewer"]} />}>
              <Route element={<ExecutiveLayout />}>
                <Route path="/executivo" element={<ExecutivoDashboard />} />
                <Route path="/executivo/automacao" element={<ExecutivoAutomacao />} />
              </Route>
            </Route>

            {/* Docs */}
            <Route path="/documentacao" element={<DocumentacaoPage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
