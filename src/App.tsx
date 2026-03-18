import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

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

// Customer pages
import ClienteDashboard from "@/pages/cliente/ClienteDashboard";
import GenericClientePage from "@/pages/cliente/GenericClientePage";

// Internal pages
import InternoDashboard from "@/pages/interno/InternoDashboard";

// Executive pages
import ExecutivoDashboard from "@/pages/executivo/ExecutivoDashboard";

// Docs
import DocumentacaoPage from "@/pages/documentacao/DocumentacaoPage";

import NotFound from "@/pages/NotFound";

import {
  Building, DollarSign, FileText, ClipboardCheck, Wrench,
  HelpCircle, Bell, Calendar, Bot, Ticket, Shield,
  Zap,
} from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to /site */}
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

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Customer */}
          <Route element={<CustomerLayout />}>
            <Route path="/cliente" element={<ClienteDashboard />} />
            <Route path="/cliente/unidade" element={<GenericClientePage title="Minha Unidade" icon={Building} emptyTitle="Nenhuma unidade vinculada" emptyDescription="Sua unidade aparecerá aqui quando estiver cadastrada." />} />
            <Route path="/cliente/financeiro" element={<GenericClientePage title="Financeiro" icon={DollarSign} emptyTitle="Nenhum registro financeiro" emptyDescription="Seus boletos e pagamentos serão exibidos aqui." />} />
            <Route path="/cliente/documentos" element={<GenericClientePage title="Documentos" icon={FileText} emptyTitle="Nenhum documento" emptyDescription="Seus documentos estarão disponíveis aqui." />} />
            <Route path="/cliente/documentos/:id" element={<GenericClientePage title="Documento" icon={FileText} emptyTitle="Documento não encontrado" emptyDescription="O documento solicitado não foi encontrado." />} />
            <Route path="/cliente/vistoria" element={<GenericClientePage title="Vistoria" icon={ClipboardCheck} emptyTitle="Nenhuma vistoria agendada" emptyDescription="Suas vistorias aparecerão aqui." />} />
            <Route path="/cliente/assistencia" element={<GenericClientePage title="Assistência Técnica" icon={Wrench} emptyTitle="Nenhuma solicitação" emptyDescription="Suas solicitações de assistência aparecerão aqui." />} />
            <Route path="/cliente/assistencia/:id" element={<GenericClientePage title="Assistência" icon={Wrench} emptyTitle="Solicitação não encontrada" emptyDescription="A solicitação não foi encontrada." />} />
            <Route path="/cliente/ajuda" element={<GenericClientePage title="Central de Ajuda" icon={HelpCircle} emptyTitle="Conteúdo em breve" emptyDescription="A central de ajuda estará disponível em breve." />} />
            <Route path="/cliente/notificacoes" element={<GenericClientePage title="Notificações" icon={Bell} emptyTitle="Nenhuma notificação" emptyDescription="Você não possui notificações no momento." />} />
            <Route path="/cliente/calendario" element={<GenericClientePage title="Calendário" icon={Calendar} emptyTitle="Nenhum evento" emptyDescription="Seus eventos e compromissos aparecerão aqui." />} />
            <Route path="/cliente/assistente" element={<GenericClientePage title="Assistente Virtual" icon={Bot} emptyTitle="Assistente em breve" emptyDescription="O assistente virtual estará disponível em breve." />} />
          </Route>

          {/* Internal */}
          <Route element={<InternalLayout />}>
            <Route path="/interno" element={<InternoDashboard />} />
            <Route path="/interno/chamados" element={<GenericClientePage title="Chamados" icon={Ticket} emptyTitle="Nenhum chamado" emptyDescription="Os chamados serão listados aqui." />} />
            <Route path="/interno/chamados/:id" element={<GenericClientePage title="Chamado" icon={Ticket} emptyTitle="Chamado não encontrado" emptyDescription="O chamado solicitado não foi encontrado." />} />
            <Route path="/interno/garantia" element={<GenericClientePage title="Garantia" icon={Shield} emptyTitle="Nenhuma solicitação de garantia" emptyDescription="As solicitações de garantia aparecerão aqui." />} />
            <Route path="/interno/agenda" element={<GenericClientePage title="Agenda" icon={Calendar} emptyTitle="Nenhum evento" emptyDescription="Os eventos da equipe aparecerão aqui." />} />
            <Route path="/interno/documentos" element={<GenericClientePage title="Documentos" icon={FileText} emptyTitle="Nenhum documento" emptyDescription="Os documentos internos serão listados aqui." />} />
            <Route path="/interno/financeiro" element={<GenericClientePage title="Financeiro" icon={DollarSign} emptyTitle="Nenhum registro" emptyDescription="Os dados financeiros aparecerão aqui." />} />
          </Route>

          {/* Executive */}
          <Route element={<ExecutiveLayout />}>
            <Route path="/executivo" element={<ExecutivoDashboard />} />
            <Route path="/executivo/automacao" element={<GenericClientePage title="Automação" icon={Zap} emptyTitle="Nenhuma automação configurada" emptyDescription="As automações serão gerenciadas aqui." />} />
          </Route>

          {/* Docs */}
          <Route path="/documentacao" element={<DocumentacaoPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
