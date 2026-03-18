import { Link } from "react-router-dom";
import { ArrowRight, Building2, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Building2,
    title: "Empreendimentos Premium",
    description: "Projetos desenvolvidos com excelência e atenção aos detalhes.",
  },
  {
    icon: Shield,
    title: "Garantia e Qualidade",
    description: "Acompanhamento completo com assistência técnica dedicada.",
  },
  {
    icon: Users,
    title: "Portal do Cliente",
    description: "Acesse documentos, financeiro e acompanhe sua unidade online.",
  },
];

export default function SiteHome() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-4xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Construindo o futuro com <span className="gradient-text">excelência</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Uma construtora comprometida com qualidade, inovação e a satisfação de cada cliente.
            </p>
            <div className="flex gap-4">
              <Link
                to="/empreendimentos"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Ver Empreendimentos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/site/contato"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
              >
                Fale Conosco
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass-card p-8"
              >
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
