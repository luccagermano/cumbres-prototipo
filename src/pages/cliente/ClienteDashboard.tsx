import { motion } from "framer-motion";
import { Building, DollarSign, FileText, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const quickLinks = [
  { label: "Minha Unidade", path: "/cliente/unidade", icon: Building, description: "Dados da sua unidade" },
  { label: "Financeiro", path: "/cliente/financeiro", icon: DollarSign, description: "Boletos e pagamentos" },
  { label: "Documentos", path: "/cliente/documentos", icon: FileText, description: "Contratos e documentos" },
  { label: "Assistência", path: "/cliente/assistencia", icon: Wrench, description: "Solicitar atendimento" },
];

export default function ClienteDashboard() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Olá, Cliente!</h1>
      <p className="text-muted-foreground mb-8">Bem-vindo ao seu painel.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((item, i) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={item.path} className="glass-card p-6 block hover:shadow-lg transition-shadow group">
              <item.icon className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-display font-semibold text-foreground mb-1">{item.label}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
