import { PageHeader } from "@/components/ui/page-header";
import { GlobalAreaSwitcher } from "@/components/GlobalAreaSwitcher";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Building, DollarSign, FileText, Ticket, Shield,
  ClipboardCheck, Calendar, Bot, Bell, Zap, Layout,
} from "lucide-react";

const modules = [
  {
    title: "Portal do Cliente",
    icon: Users,
    description: "Área autenticada onde o cliente acompanha sua unidade, contrato, parcelas, documentos, chamados, vistorias e notificações.",
    features: ["Dashboard com KPIs e jornada da compra", "Detalhes da unidade e contrato", "Financeiro com filtros e saldo", "Documentos com download seguro", "Calendário unificado", "Assistente Virtual"],
  },
  {
    title: "Empreendimentos",
    icon: Building,
    description: "Catálogo público de empreendimentos com informações técnicas, blocos e unidades disponíveis.",
    features: ["Listagem e detalhe por slug", "Mural de novidades", "Integração com campanhas e leads"],
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    description: "Módulo nativo de gestão financeira sem dependência de ERP externo. Parcelas, pagamentos e inadimplência gerenciados internamente.",
    features: ["Contratos de venda vinculados a unidades", "Parcelas com status: pendente, pago, vencido", "Registro manual de pagamentos", "KPIs de receita, inadimplência e saldo"],
  },
  {
    title: "Chamados e Suporte",
    icon: Ticket,
    description: "Sistema de tickets para assistência técnica com status público e interno, prioridade, atribuição e mensagens.",
    features: ["Abertura pelo cliente com categoria e cômodo", "Fluxo interno com atribuição e SLA", "Mensagens públicas e notas internas", "Vinculação com regras de garantia"],
  },
  {
    title: "Garantias",
    icon: Shield,
    description: "Cadastro de regras de garantia por categoria, com prazo em meses, condições e recomendações. Usado na abertura de chamados.",
    features: ["Regras por categoria com prazo", "Cláusula contratual e condição de cobertura", "Verificação automática na abertura de ticket"],
  },
  {
    title: "Vistorias",
    icon: ClipboardCheck,
    description: "Agendamento de vistorias pelo cliente com execução interna. Slots configuráveis, checklist e relatório de itens.",
    features: ["Tipos de vistoria configuráveis", "Slots com capacidade e localização", "Booking pelo cliente", "Relatório de itens por cômodo"],
  },
  {
    title: "Documentos",
    icon: FileText,
    description: "Tabela central de documentos usada por todos os módulos. Armazenamento privado com download via signed URLs.",
    features: ["Upload interno com categorização", "Visibilidade configurável (cliente/interno)", "Vinculação com contrato, unidade, ticket, vistoria", "Storage privado com políticas de acesso"],
  },
  {
    title: "Calendário",
    icon: Calendar,
    description: "Calendário unificado que agrega parcelas, vistorias agendadas e eventos customizados em uma única visualização.",
    features: ["Eventos de diferentes fontes", "Eventos customizados por organização", "Filtro por visibilidade ao cliente"],
  },
  {
    title: "Notificações",
    icon: Bell,
    description: "Sistema de notificações in-app com controle de leitura. Preparado para futura integração com push e email.",
    features: ["Notificações por usuário", "Marcar como lida individualmente ou em lote", "Action URL para navegação direta"],
  },
  {
    title: "FAQ e Ajuda",
    icon: BookOpen,
    description: "Base de conhecimento com categorias e artigos em Markdown, filtrável por audiência e com busca.",
    features: ["Categorias ordenáveis", "Artigos com body em Markdown", "Busca por título e conteúdo", "CTA para WhatsApp"],
  },
  {
    title: "Captação de Leads",
    icon: Layout,
    description: "Formulários públicos em páginas de contato e campanhas que salvam leads diretamente no banco de dados.",
    features: ["Formulário na página de contato", "Formulário em campanhas com slug", "Source type e campaign tracking"],
  },
  {
    title: "Base de Conhecimento (IA)",
    icon: Bot,
    description: "Infraestrutura para indexação de documentos e busca semântica. Preparada para integração com modelos de IA.",
    features: ["Knowledge sources vinculadas a documentos", "Chunks com embedding (preparado)", "Audit events para rastreabilidade"],
  },
  {
    title: "Automação",
    icon: Zap,
    description: "Centro de automação para fluxos futuros como notificação de vencimento, classificação de chamados e geração de relatórios.",
    features: ["Fluxos planejados por categoria", "Integração futura com edge functions", "Roadmap visual de automações"],
  },
];

export default function DocumentacaoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalAreaSwitcher />
      <div className="flex-1 pt-11">
        <div className="container py-12 max-w-5xl">
          <PageHeader
            title="Documentação da Plataforma"
            description="Guia completo dos módulos implementados, arquitetura e funcionalidades disponíveis."
            breadcrumb={["Documentação"]}
          />

          <div className="glass-card p-6 mb-8">
            <h3 className="font-display font-semibold text-foreground mb-2">Visão Geral</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A plataforma é dividida em quatro áreas principais: <strong>Portal do Cliente</strong> (acesso autenticado para compradores),{" "}
              <strong>Painel Interno</strong> (equipe operacional: suporte, financeiro, documentos, agenda),{" "}
              <strong>Dashboard Executivo</strong> (indicadores estratégicos e automação) e{" "}
              <strong>Área Pública</strong> (site, empreendimentos, campanhas e captação de leads).
              Toda a autenticação e dados são gerenciados via Lovable Cloud com políticas de segurança por linha (RLS).
            </p>
          </div>

          <div className="space-y-4">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="glass-card p-6">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                      <mod.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{mod.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>
                    </div>
                  </div>
                  <div className="ml-14">
                    <ul className="grid sm:grid-cols-2 gap-1.5">
                      {mod.features.map((f) => (
                        <li key={f} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
