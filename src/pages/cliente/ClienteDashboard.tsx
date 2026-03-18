import { motion } from "framer-motion";
import { Building, DollarSign, FileText, Wrench, Bell, Calendar, Bot, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";

const quickLinks = [
  { label: "Minha Unidade", path: "/cliente/unidade", icon: Building, description: "Dados e progresso da unidade" },
  { label: "Financeiro", path: "/cliente/financeiro", icon: DollarSign, description: "Boletos e pagamentos" },
  { label: "Documentos", path: "/cliente/documentos", icon: FileText, description: "Contratos e arquivos" },
  { label: "Vistoria", path: "/cliente/vistoria", icon: ClipboardCheck, description: "Agendamentos e laudos" },
  { label: "Assistência", path: "/cliente/assistencia", icon: Wrench, description: "Solicitar atendimento técnico" },
  { label: "Notificações", path: "/cliente/notificacoes", icon: Bell, description: "Avisos e comunicados" },
  { label: "Calendário", path: "/cliente/calendario", icon: Calendar, description: "Eventos e compromissos" },
  { label: "Assistente", path: "/cliente/assistente", icon: Bot, description: "Assistente virtual" },
];

export default function ClienteDashboard() {
  return (
    <div>
      <PageHeader
        title="Olá, Cliente!"
        description="Bem-vindo ao seu portal. Acesse rapidamente os serviços disponíveis."
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {quickLinks.map((item, i) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link to={item.path} className="glass-card p-5 block hover:shadow-lg hover:scale-[1.01] transition-all group">
              <div className="p-2 rounded-xl bg-primary/10 w-fit mb-3 group-hover:bg-primary/15 transition-colors">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-sm text-foreground mb-0.5">{item.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
