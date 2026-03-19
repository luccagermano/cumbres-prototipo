import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { useOrg } from "@/contexts/OrgContext";
import heroImg from "@/assets/hero-building.jpg";
import proj1 from "@/assets/project-1.jpg";
import proj2 from "@/assets/project-2.jpg";
import proj3 from "@/assets/project-3.jpg";
import aboutImg from "@/assets/about-studio.jpg";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.12 } } };

const projects = [
  { img: proj1, name: "Residencial Arvoredo", type: "Apartamentos · 2 e 3 dormitórios", location: "Porto Alegre, RS", year: "2025" },
  { img: proj2, name: "Torre Mirante", type: "Apartamentos · Alto padrão", location: "Curitiba, PR", year: "2024" },
  { img: proj3, name: "Jardins do Parque", type: "Condomínio · Casas", location: "Florianópolis, SC", year: "2026" },
];

const pillars = [
  { title: "Integridade de projeto", text: "Cada empreendimento nasce de uma investigação profunda sobre o lugar, o programa e a materialidade. Não projetamos para impressionar — projetamos para permanecer." },
  { title: "Inovação com propósito", text: "Adotamos tecnologias construtivas que tornam o processo mais eficiente, sustentável e previsível, sem jamais comprometer a qualidade da experiência final." },
  { title: "Experiência de morar", text: "O resultado do nosso trabalho se mede no cotidiano de quem habita. Conforto, funcionalidade e beleza são inegociáveis." },
];

const steps = [
  { n: "01", title: "Estudos iniciais", text: "Análise de viabilidade, contexto urbano e definição do partido arquitetônico." },
  { n: "02", title: "Desenvolvimento do produto", text: "Detalhamento de projeto, especificações técnicas e curadoria de materiais." },
  { n: "03", title: "Aprovação e compatibilização", text: "Integração de disciplinas, licenciamento e revisão executiva." },
  { n: "04", title: "Lançamento", text: "Estratégia comercial alinhada ao posicionamento do empreendimento." },
  { n: "05", title: "Obra", text: "Execução com controle rigoroso de qualidade, cronograma e segurança." },
  { n: "06", title: "Entrega", text: "Vistoria, acabamentos finais e transferência ao cliente." },
  { n: "07", title: "Pós-obra", text: "Assistência técnica contínua e acompanhamento de garantia." },
];

export default function SiteHome() {
  const { org } = useOrg();
  const brandName = org?.name ?? "Construtora";

  return (
    <div className="font-body">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] flex items-end pb-16 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Empreendimento premium" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-700/80 via-brand-700/40 to-transparent" />
        </div>

        <div className="container relative z-10 max-w-5xl">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.p variants={fade} className="text-brand-200 text-sm tracking-[0.2em] uppercase mb-6">
              {brandName}
            </motion.p>
            <motion.h1
              variants={fade}
              className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.08] mb-8 max-w-3xl"
            >
              Arquitetura, contexto
              <br className="hidden sm:block" /> e permanência.
            </motion.h1>
            <motion.p variants={fade} className="text-brand-100/80 text-base lg:text-lg max-w-lg mb-12 leading-relaxed">
              Empreendimentos concebidos com rigor, identidade e visão. Qualidade construtiva que valoriza o presente e permanece no futuro.
            </motion.p>
            <motion.div variants={fade} className="flex flex-wrap gap-4">
              <Link
                to="/empreendimentos"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-brand-600 text-sm font-semibold hover:bg-brand-50 transition-colors"
              >
                Ver Empreendimentos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/site/contato"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Fale Conosco
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
        >
          <ArrowDown className="h-5 w-5 animate-bounce" />
        </motion.div>
      </section>

      {/* ─── SOBRE / A CONSTRUTORA ─── */}
      <section className="py-24 lg:py-36 bg-[#f3f8e8]">
        <div className="container max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center"
          >
            <motion.div variants={fade}>
              <span className="text-brand-400 text-xs tracking-[0.25em] uppercase font-medium">01 — Estúdio</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-brand-600 mt-4 mb-8 leading-tight">
                A Construtora
              </h2>
              <div className="space-y-5 text-brand-700/80 leading-relaxed">
                <p>
                  Atuamos no desenvolvimento de empreendimentos residenciais com foco em qualidade construtiva,
                  integração ao contexto urbano e compromisso com a experiência de quem habita.
                </p>
                <p>
                  Cada projeto é resultado de uma investigação cuidadosa sobre o lugar, os materiais e
                  as necessidades reais do morador. Não seguimos tendências — construímos valor duradouro.
                </p>
                <p>
                  Nossa equipe reúne engenheiros, arquitetos e gestores dedicados a entregar excelência
                  em cada etapa, do estudo inicial ao pós-obra.
                </p>
              </div>
              <Link
                to="/site/sobre"
                className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                Conheça nossa história
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
            <motion.div variants={fade} className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img src={aboutImg} alt="Equipe" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-2xl bg-brand-500/10 -z-10" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── EMPREENDIMENTOS ─── */}
      <section className="py-24 lg:py-36">
        <div className="container max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fade} className="flex items-end justify-between mb-16">
              <div>
                <span className="text-brand-400 text-xs tracking-[0.25em] uppercase font-medium">02 — Portfólio</span>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-4 leading-tight">
                  Empreendimentos em destaque
                </h2>
              </div>
              <Link
                to="/empreendimentos"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                Ver todos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {projects.map((p, i) => (
                <motion.div key={p.name} variants={fade} custom={i}>
                  <Link to="/empreendimentos" className="group block">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-5 bg-muted">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-brand-500 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{p.type}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{p.location} · {p.year}</p>
                  </Link>
                </motion.div>
              ))}
            </div>

            <Link
              to="/empreendimentos"
              className="sm:hidden inline-flex items-center gap-2 mt-10 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Ver todos os empreendimentos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── PRINCÍPIOS / VISÃO ─── */}
      <section className="py-24 lg:py-36 bg-[#f3f8e8]">
        <div className="container max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fade} className="mb-16">
              <span className="text-brand-400 text-xs tracking-[0.25em] uppercase font-medium">03 — Visão</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-brand-600 mt-4 leading-tight">
                Princípios que orientam cada projeto
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
              {pillars.map((p, i) => (
                <motion.div key={p.title} variants={fade} custom={i}>
                  <div className="w-10 h-px bg-brand-400/40 mb-6" />
                  <h3 className="font-display text-lg font-semibold text-brand-600 mb-4">{p.title}</h3>
                  <p className="text-sm text-brand-700/70 leading-relaxed">{p.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── MÉTODO / PROCESSO ─── */}
      <section className="py-24 lg:py-36">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fade} className="mb-16">
              <span className="text-brand-400 text-xs tracking-[0.25em] uppercase font-medium">04 — Método</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-4 leading-tight">
                Nosso processo
              </h2>
              <p className="text-muted-foreground mt-4 max-w-lg leading-relaxed">
                Um fluxo estruturado que garante previsibilidade, qualidade e transparência em cada etapa.
              </p>
            </motion.div>

            <div className="space-y-0">
              {steps.map((s, i) => (
                <motion.div
                  key={s.n}
                  variants={fade}
                  custom={i}
                  className="grid grid-cols-[3rem_1fr] gap-6 py-8 border-t border-border/60 last:border-b"
                >
                  <span className="font-display text-sm font-semibold text-brand-400">{s.n}</span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{s.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 lg:py-36 bg-brand-600 text-white">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fade}
              className="font-display text-3xl lg:text-5xl font-bold leading-tight mb-6"
            >
              Vamos construir juntos?
            </motion.h2>
            <motion.p variants={fade} className="text-white/70 text-lg max-w-md mx-auto mb-10 leading-relaxed">
              Conheça nossos empreendimentos ou fale com nossa equipe para encontrar o projeto ideal.
            </motion.p>
            <motion.div variants={fade} className="flex flex-wrap justify-center gap-4">
              <Link
                to="/empreendimentos"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-brand-600 text-sm font-semibold hover:bg-brand-50 transition-colors"
              >
                Conheça os Empreendimentos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/site/contato"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Fale com a Equipe
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
