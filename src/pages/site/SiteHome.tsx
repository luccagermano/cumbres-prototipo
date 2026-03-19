import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import heroImg from "@/assets/site/hero-building.jpg";
import studioImg from "@/assets/site/studio-detail.jpg";
import project1 from "@/assets/site/project-1.jpg";
import project2 from "@/assets/site/project-2.jpg";
import project3 from "@/assets/site/project-3.jpg";
import visionBg from "@/assets/site/vision-bg.jpg";

gsap.registerPlugin(ScrollTrigger);

/* ── data ─────────────────────────────────────────── */
const projects = [
  { name: "Parque das Águas", type: "Multirresidencial", year: "2024", img: project1 },
  { name: "Edifício Solaris", type: "Residencial Premium", year: "2023", img: project2 },
  { name: "Vila Serena", type: "Residências Integradas", year: "2025", img: project3 },
];

const principles = [
  {
    num: "01",
    title: "Integridade de projeto",
    body: "Cada decisão construtiva nasce do respeito ao contexto, ao terreno e à história do lugar. Projetamos com intenção: sem excessos, sem concessões. A integridade do projeto é o fio condutor que conecta conceito, execução e vivência.",
  },
  {
    num: "02",
    title: "Inovação com propósito",
    body: "Abraçamos a inovação como ferramenta — não como ornamento. Pesquisa tecnológica, processos construtivos avançados e experimentação material são parte do nosso método. Mas a criatividade humana sempre conduz.",
  },
  {
    num: "03",
    title: "Experiência ampliada de morar",
    body: "Nosso compromisso vai além da entrega das chaves. Projetamos experiências de morar que evoluem com o tempo — espaços que convidam à permanência, ao encontro e à transformação pessoal.",
  },
];

const steps = [
  { num: "01", label: "Descoberta" },
  { num: "02", label: "Conceito" },
  { num: "03", label: "Desenvolvimento" },
  { num: "04", label: "Compatibilização" },
  { num: "05", label: "Obra" },
  { num: "06", label: "Entrega" },
  { num: "07", label: "Pós-obra" },
];

/* ── component ────────────────────────────────────── */
export default function SiteHome() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lenis smooth scroll
    const lenis = new Lenis({ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);

    // GSAP reveal animations
    const ctx = gsap.context(() => {
      // Hero text
      gsap.from("[data-hero-text]", {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.15,
        delay: 0.3,
      });

      // Hero image
      gsap.from("[data-hero-img]", {
        scale: 1.15,
        opacity: 0,
        duration: 1.6,
        ease: "power2.out",
        delay: 0.6,
      });

      // Scroll cue
      gsap.from("[data-scroll-cue]", {
        opacity: 0,
        y: 10,
        duration: 0.8,
        delay: 1.8,
      });

      // Generic reveal for sections
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });

      // Image reveals with clip
      gsap.utils.toArray<HTMLElement>("[data-img-reveal]").forEach((el) => {
        gsap.from(el, {
          clipPath: "inset(20% 0% 20% 0%)",
          opacity: 0,
          scale: 1.08,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      });

      // Process steps stagger
      gsap.from("[data-step]", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: "[data-steps-container]",
          start: "top 75%",
        },
      });
    }, mainRef);

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={mainRef} className="site-home bg-white text-[#1a1a1a] overflow-x-hidden">
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 mix-blend-difference pointer-events-none">
        <div className="flex items-center justify-between px-6 md:px-12 py-5 pointer-events-auto">
          <Link to="/site" className="font-display text-sm md:text-base font-bold tracking-[0.08em] uppercase text-white">
            Construtora
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {["Início", "Projetos", "Processo", "Estúdio", "Contato"].map((item) => (
              <Link
                key={item}
                to={item === "Contato" ? "/site/contato" : item === "Projetos" ? "/empreendimentos" : "/site"}
                className="text-[13px] text-white/80 hover:text-white transition-colors tracking-wide"
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            <span className="text-[12px] text-white/60 hidden lg:inline tracking-wide">Brasil</span>
            <Link
              to="/site/contato"
              className="text-[13px] text-white hover:text-white/70 transition-colors tracking-wide"
            >
              Contato
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col justify-end pb-16 md:pb-24 bg-white">
        {/* Large brand name */}
        <div className="px-6 md:px-12 pt-32 md:pt-40 mb-12 md:mb-20">
          <h1 data-hero-text className="font-display text-[clamp(3rem,10vw,9rem)] font-bold leading-[0.9] tracking-[-0.03em] text-[#1a1a1a] uppercase">
            Construtora
          </h1>
        </div>

        {/* Hero image centered */}
        <div className="px-6 md:px-[12%] mb-16 md:mb-24">
          <div data-hero-img className="relative w-full max-w-[740px] mx-auto overflow-hidden">
            <img
              src={heroImg}
              alt="Empreendimento premium com vegetação integrada à fachada"
              className="w-full h-auto object-cover"
              loading="eager"
            />
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between px-6 md:px-12">
          <p data-hero-text className="text-sm md:text-base text-[#6d8f6f] max-w-xs leading-relaxed">
            Guiados pela história,<br />
            centrados no contexto,<br />
            abraçando a cultura.
          </p>
          <div data-scroll-cue className="text-[11px] text-[#a9ce99] tracking-widest uppercase">
            [Rolar]
          </div>
        </div>
      </section>

      {/* ─── STUDIO ─── */}
      <section className="py-32 md:py-48 px-6 md:px-12">
        <div className="grid md:grid-cols-12 gap-12 md:gap-8">
          {/* Left: number + image */}
          <div className="md:col-span-4">
            <span data-reveal className="text-[11px] tracking-widest text-[#a9ce99] uppercase mb-8 block">01 &nbsp; Estúdio</span>
            <div data-img-reveal className="w-full max-w-[280px] overflow-hidden">
              <img src={studioImg} alt="Detalhe arquitetônico em concreto" className="w-full h-auto object-cover" loading="lazy" />
            </div>
          </div>

          {/* Right: text */}
          <div className="md:col-span-7 md:col-start-6 flex flex-col justify-center">
            <p data-reveal className="text-sm md:text-base text-[#6d8f6f] leading-relaxed max-w-md mb-16">
              Conectamos, criamos e construímos em territórios que carregam significado. Reconhecemos a história, a cultura e as conexões de cada lugar — e prestamos nosso respeito ao que veio antes e ao que virá depois.
            </p>
            <h2 data-reveal className="font-display text-[clamp(2rem,5vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.02em] text-[#1a1a1a]">
              Somos um estúdio de Arquitetura &amp; Construção, desenvolvendo projetos residenciais premium em todo o Brasil.
            </h2>
          </div>
        </div>
      </section>

      {/* ─── SELECTED WORKS ─── */}
      <section className="pb-32 md:pb-48">
        <div className="px-6 md:px-12 mb-20 md:mb-32">
          <span data-reveal className="text-[11px] tracking-widest text-[#a9ce99] uppercase block mb-4">Projetos selecionados</span>
          <h2 data-reveal className="font-display text-[clamp(2.5rem,6vw,6rem)] font-bold tracking-[-0.03em] text-[#1a1a1a]">
            Obras<sup className="text-[0.4em] text-[#a9ce99] ml-1">({projects.length.toString().padStart(2, "0")})</sup>
          </h2>
        </div>

        <div className="space-y-24 md:space-y-40">
          {projects.map((p, i) => (
            <article key={p.name} className="group px-6 md:px-12">
              <div className="grid md:grid-cols-12 gap-6 items-start">
                {/* Project name */}
                <div className={`md:col-span-5 flex flex-col justify-center ${i % 2 === 1 ? "md:order-2 md:col-start-8" : ""}`}>
                  <div data-reveal>
                    <span className="text-[11px] tracking-widest text-[#a9ce99] uppercase block mb-3">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-[clamp(2rem,4vw,4rem)] font-bold tracking-[-0.02em] text-[#1a1a1a] leading-[1.05] mb-4">
                      <span className="inline-block relative">
                        <span className="relative z-10">[</span>
                        <span className="mx-3">{p.name}</span>
                        <span className="relative z-10">]</span>
                      </span>
                    </h3>
                    <div className="flex items-center gap-8 text-[13px] text-[#6d8f6f]">
                      <span>{p.type}</span>
                      <span>{p.year}</span>
                    </div>
                  </div>
                </div>

                {/* Project image */}
                <div className={`md:col-span-6 ${i % 2 === 1 ? "md:order-1 md:col-start-1" : "md:col-start-7"}`}>
                  <div data-img-reveal className="overflow-hidden cursor-pointer">
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="px-6 md:px-12 mt-20 md:mt-32">
          <Link
            to="/empreendimentos"
            data-reveal
            className="inline-flex items-center gap-3 text-[13px] font-medium text-[#276233] hover:text-[#348846] transition-colors tracking-wide group/link"
          >
            Ver todos os projetos
            <span className="inline-block transition-transform group-hover/link:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* ─── VISION ─── */}
      <section className="relative">
        {/* Full-bleed image background */}
        <div className="relative min-h-screen">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${visionBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

          <div className="relative z-10 px-6 md:px-12 py-32 md:py-48">
            <span data-reveal className="text-[11px] tracking-widest text-[#a9ce99] uppercase block mb-16">Visão</span>

            <div className="space-y-24 md:space-y-32 max-w-5xl">
              {principles.map((p) => (
                <div key={p.num} data-reveal className="grid md:grid-cols-12 gap-8">
                  <div className="md:col-span-1">
                    <span className="text-[11px] tracking-widest text-[#a9ce99]">{p.num}</span>
                  </div>
                  <div className="md:col-span-4">
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight mb-4">{p.title}</h3>
                  </div>
                  <div className="md:col-span-6 md:col-start-7">
                    <p className="text-[15px] text-white/75 leading-relaxed">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── METHOD ─── */}
      <section className="py-32 md:py-48 px-6 md:px-12 bg-white">
        <div className="max-w-5xl">
          <span data-reveal className="text-[11px] tracking-widest text-[#a9ce99] uppercase block mb-6">Método</span>
          <h2 data-reveal className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-[-0.02em] text-[#1a1a1a] mb-20 md:mb-28 max-w-2xl leading-[1.1]">
            Um processo que valoriza cada etapa, do primeiro traço à vivência plena.
          </h2>
        </div>

        <div data-steps-container className="border-t border-[#e8e8e8]">
          {steps.map((s) => (
            <div
              key={s.num}
              data-step
              className="flex items-center justify-between py-6 md:py-8 border-b border-[#e8e8e8] group cursor-default"
            >
              <div className="flex items-center gap-6 md:gap-12">
                <span className="text-[12px] text-[#a9ce99] tracking-widest font-medium w-6">{s.num}</span>
                <span className="font-display text-xl md:text-2xl font-semibold text-[#1a1a1a] group-hover:text-[#276233] transition-colors duration-300">
                  {s.label}
                </span>
              </div>
              <span className="text-[#a9ce99] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                →
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CONTACT CTA ─── */}
      <section className="py-32 md:py-48 px-6 md:px-12 bg-[#f9fbf7]">
        <div className="max-w-4xl">
          <p data-reveal className="text-sm text-[#a9ce99] mb-6 tracking-wide">
            Fale sobre o seu projeto
          </p>
          <h2 data-reveal className="font-display text-[clamp(2.5rem,5vw,5rem)] font-bold tracking-[-0.02em] text-[#1a1a1a] leading-[1.05] mb-8">
            Vamos conversar
          </h2>
          <Link
            to="/site/contato"
            data-reveal
            className="inline-block font-display text-lg md:text-xl font-semibold text-[#276233] border-b-2 border-[#276233] pb-1 hover:text-[#348846] hover:border-[#348846] transition-colors"
          >
            Entre em contato
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#1a1a1a] text-white pt-24 md:pt-32 pb-8">
        <div className="px-6 md:px-12">
          <div className="grid md:grid-cols-12 gap-12 md:gap-8 mb-24 md:mb-32">
            {/* CTA */}
            <div className="md:col-span-5">
              <p className="text-sm text-white/40 mb-4">Fale sobre o seu projeto</p>
              <Link
                to="/site/contato"
                className="font-display text-2xl md:text-3xl font-bold text-white border-b border-white pb-1 hover:text-[#a9ce99] hover:border-[#a9ce99] transition-colors"
              >
                Entre em contato
              </Link>
            </div>

            {/* Nav */}
            <div className="md:col-span-3 md:col-start-7">
              <nav className="flex flex-col gap-3">
                {["Início", "Projetos", "Estúdio", "Processo", "Contato"].map((item) => (
                  <Link
                    key={item}
                    to={item === "Contato" ? "/site/contato" : item === "Projetos" ? "/empreendimentos" : "/site"}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Info */}
            <div className="md:col-span-3">
              <div className="space-y-4 text-sm text-white/60">
                <div>
                  <span className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">L</span>
                  Rua das Palmeiras, 200<br />
                  São Paulo<br />
                  Brasil, 01234-000
                </div>
                <div>
                  <span className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">T</span>
                  +55 11 3456 7890
                </div>
                <div>
                  <span className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">E</span>
                  contato@construtora.com.br
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t border-white/10 pt-6">
            <span className="text-[11px] text-white/30">
              © {new Date().getFullYear()} Construtora. Todos os direitos reservados.
            </span>
            <div className="flex items-center gap-6 text-[11px] text-white/30">
              <a href="#" className="hover:text-white/60 transition-colors">Política de privacidade</a>
              <a href="#" className="hover:text-white/60 transition-colors">Termos de uso</a>
              <a href="#" className="hover:text-white/60 transition-colors">Instagram</a>
              <a href="#" className="hover:text-white/60 transition-colors">LinkedIn</a>
            </div>
          </div>

          {/* Large brand */}
          <div className="mt-16 md:mt-20 overflow-hidden">
            <h2 className="font-display text-[clamp(4rem,14vw,12rem)] font-bold tracking-[-0.03em] text-white/10 uppercase leading-none whitespace-nowrap select-none">
              Construtora
            </h2>
          </div>
        </div>
      </footer>
    </div>
  );
}
