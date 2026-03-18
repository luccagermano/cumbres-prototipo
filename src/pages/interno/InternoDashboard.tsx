import { motion } from "framer-motion";
import { Ticket, Shield, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  { label: "Chamados", path: "/interno/chamados", icon: Ticket, count: 0, description: "Tickets abertos" },
  { label: "Garantia", path: "/interno/garantia", icon: Shield, count: 0, description: "Solicitações ativas" },
  { label: "Agenda", path: "/interno/agenda", icon: Calendar, count: 0, description: "Eventos do dia" },
];

export default function InternoDashboard() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Área Interna</h1>
      <p className="text-muted-foreground mb-8">Painel de operações.</p>

      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={card.path} className="glass-card p-6 block hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <card.icon className="h-5 w-5 text-primary" />
                <span className="font-display text-2xl font-bold text-foreground">{card.count}</span>
              </div>
              <h3 className="font-display font-semibold text-foreground">{card.label}</h3>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
