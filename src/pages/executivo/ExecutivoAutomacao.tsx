import { PageHeader } from "@/components/ui/page-header";
import { motion } from "framer-motion";
import { Zap, Bell, FileText, Bot, BarChart3, Clock, ArrowRight } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";

const automations = [
  {
    title: "Notificação de Vencimento",
    description: "Enviar notificação automática ao cliente 5 dias antes do vencimento de uma parcela.",
    icon: Bell,
    status: "Em breve",
    category: "Financeiro",
  },
  {
    title: "Marcação de Inadimplência",
    description: "Alterar automaticamente o status de parcelas não pagas após a data de vencimento.",
    icon: Clock,
    status: "Em breve",
    category: "Financeiro",
  },
  {
    title: "Geração de Relatórios",
    description: "Gerar relatórios mensais de performance financeira e operacional automaticamente.",
    icon: BarChart3,
    status: "Em breve",
    category: "Executivo",
  },
  {
    title: "Classificação de Chamados",
    description: "Usar IA para classificar e priorizar chamados automaticamente com base no conteúdo.",
    icon: Bot,
    status: "Futuro",
    category: "Suporte",
  },
  {
    title: "Indexação de Documentos",
    description: "Processar e indexar documentos enviados para busca inteligente no assistente virtual.",
    icon: FileText,
    status: "Futuro",
    category: "Base de Conhecimento",
  },
  {
    title: "Fluxo de Aprovação",
    description: "Workflow de aprovação automática para solicitações de serviços complementares.",
    icon: Zap,
    status: "Futuro",
    category: "Operacional",
  },
];

export default function ExecutivoAutomacao() {
  return (
    <div>
      <PageHeader
        title="Automação"
        description="Configure fluxos automatizados e integrações para a plataforma."
        breadcrumb={["Executivo", "Automação"]}
      />

      <div className="glass-card p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground mb-1">Centro de Automação</h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              As automações permitem que processos repetitivos sejam executados automaticamente pela plataforma.
              Esta seção será expandida conforme novos módulos forem ativados. Abaixo estão os fluxos planejados.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map((auto, i) => (
          <motion.div
            key={auto.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="glass-card p-5 h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <auto.icon className="h-5 w-5 text-primary" />
                </div>
                <StatusChip
                  variant={auto.status === "Em breve" ? "warning" : "default"}
                  label={auto.status}
                />
              </div>
              <h4 className="font-display font-semibold text-sm text-foreground mb-1">{auto.title}</h4>
              <p className="text-xs text-muted-foreground flex-1">{auto.description}</p>
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">{auto.category}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
