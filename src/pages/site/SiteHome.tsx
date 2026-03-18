import { Link } from "react-router-dom";
import { ArrowRight, Building2, Shield, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Building2,
    title: "Empreendimentos Premium",
    description: "Projetos desenvolvidos com excelência, tecnologia e atenção aos detalhes construtivos.",
  },
  {
    icon: Shield,
    title: "Garantia e Qualidade",
    description: "Acompanhamento completo com assistência técnica dedicada e garantia estendida.",
  },
  {
    icon: Users,
    title: "Portal Digital",
    description: "Acesse documentos, financeiro e acompanhe sua unidade de qualquer lugar.",
  },
  {
    icon: Sparkles,
    title: "Tecnologia Construtiva",
    description: "Processos inovadores que garantem eficiência, sustentabilidade e qualidade superior.",
  },
];

export default function SiteHome() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/60 to-background" />
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary mb-6">
              <Sparkles className="h-3 w-3" />
              Construindo o futuro
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-bold text-foreground leading-[1.1] mb-6">
              Excelência em cada{" "}
              <span className="gradient-text">detalhe</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg">
              Uma construtora comprometida com qualidade, inovação e a satisfação de cada cliente. Do projeto à entrega, cuidamos de tudo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/empreendimentos"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
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
      <section className="py-24 bg-card/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">Por que nos escolher</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Combinamos tradição construtiva com tecnologia de ponta.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="glass-card p-6 group hover:shadow-lg transition-shadow"
              >
                <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="glass-panel p-12 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Pronto para realizar seu sonho?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Entre em contato e descubra o empreendimento ideal para você.
            </p>
            <Link
              to="/site/contato"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Entrar em Contato
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
