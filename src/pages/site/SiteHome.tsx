import { useEffect, useRef, useState } from "react";
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

export default function SiteHome() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // Hero brand reveal — dramatic clip from bottom
      gsap.from("[data-hero-brand]", {
        yPercent: 100,
        duration: 1.4,
        ease: "power4.out",
        delay: 0.2,
      });

      // Hero image — scale + fade
      gsap.from("[data-hero-img]", {
        scale: 1.2,
        opacity: 0,
        duration: 2,
        ease: "power2.out",
        delay: 0.5,
      });

      // Hero bottom elements
      gsap.from("[data-hero-meta]", {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        delay: 1.2,
      });

      // Scroll cue gentle pulse
      gsap.to("[data-scroll-cue]", {
        y: 6,
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: "sine.inOut",
        delay: 2,
      });
      gsap.from("[data-scroll-cue]", {
        opacity: 0,
        duration: 1,
        delay: 2,
      });

      // Section reveals — slower, bigger travel
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 80,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });
      });

      // Large text reveals — character-level feel via clip
      gsap.utils.toArray<HTMLElement>("[data-reveal-text]").forEach((el) => {
        gsap.from(el, {
          clipPath: "inset(0 0 100% 0)",
          y: 40,
          duration: 1.4,
          ease: "power4.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });

      // Image reveals — clip from edges
      gsap.utils.toArray<HTMLElement>("[data-img-reveal]").forEach((el) => {
        gsap.from(el, {
          clipPath: "inset(15% 0% 15% 0%)",
          scale: 1.1,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        });
      });

      // Process steps
      gsap.from("[data-step]", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: "[data-steps-container]",
          start: "top 78%",
        },
      });

      // Parallax on hero image
      gsap.to("[data-hero-img] img", {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-hero-section]",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Footer brand reveal
      gsap.from("[data-footer-brand]", {
        yPercent: 50,
        opacity: 0,
        duration: 1.4,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "[data-footer-brand]",
          start: "top 95%",
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
        <div className="flex items-center justify-between px-8 md:px-16 lg:px-20 h-16 md:h-20 pointer-events-auto">
          <div className="flex items-center gap-10 md:gap-16">
            <Link
              to="/site"
              className="font-display text-[13px] md:text-[14px] font-bold tracking-[0.12em] uppercase text-white"
            >
              Construtora
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              {["Projetos", "Processo", "Estúdio"].map((item, i) => (
                <span key={item} className="flex items-center">
                  {i > 0 && <span className="text-white/30 mx-2 text-[12px]">,</span>}
                  <Link
                    to={item === "Projetos" ? "/empreendimentos" : "/site"}
                    className="text-[13px] text-white/70 hover:text-white transition-colors duration-300"
                  >
                    {item}
                  </Link>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-8 md:gap-12">
            <span className="text-[12px] text-white/40 hidden lg:inline tabular-nums tracking-wider">
              {currentTime}
            </span>
            <span className="text-[12px] text-white/50 hidden lg:inline">São Paulo, BRA</span>
            <Link
              to="/site/contato"
              className="text-[13px] text-white/80 hover:text-white transition-colors duration-300"
            >
              Contato
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section data-hero-section className="relative h-screen flex flex-col bg-white">
        {/* Brand name — fills width, positioned top */}
        <div className="px-8 md:px-16 lg:px-20 pt-28 md:pt-32 overflow-hidden">
          <div data-hero-brand>
            <h1 className="font-display text-[clamp(4.5rem,15vw,14rem)] font-bold leading-[0.85] tracking-[-0.04em] text-[#1a1a1a] uppercase select-none">
              Construtora
            </h1>
          </div>
        </div>

        {/* Hero image — large, centered, with breathing room */}
        <div className="flex-1 flex items-center justify-center px-8 md:px-[15%] lg:px-[20%] py-8">
          <div data-hero-img className="relative w-full max-w-[680px] overflow-hidden">
            <img
              src={heroImg}
              alt="Empreendimento premium com vegetação integrada à fachada"
              className="w-full h-auto object-cover will-change-transform"
              loading="eager"
            />
          </div>
        </div>

        {/* Bottom metadata row */}
        <div className="flex items-end justify-between px-8 md:px-16 lg:px-20 pb-8 md:pb-12">
          <p data-hero-meta className="text-[13px] md:text-[14px] text-[#6d8f6f] leading-[1.6] max-w-[260px]">
            Guiados pela história,<br />
            centrados no contexto,<br />
            abraçando a cultura.
          </p>
          <div data-scroll-cue className="text-[10px] text-[#a9ce99]/70 tracking-[0.25em] uppercase">
            [Rolar]
          </div>
        </div>
      </section>

      {/* ─── STUDIO ─── */}
      <section className="py-48 md:py-64 lg:py-80 px-8 md:px-16 lg:px-20">
        <div className="grid md:grid-cols-12 gap-16 md:gap-8">
          {/* Left column */}
          <div className="md:col-span-3">
            <span data-reveal className="text-[10px] tracking-[0.25em] text-[#a9ce99] uppercase mb-12 block">
              01 &mdash; Estúdio
            </span>
            <div data-img-reveal className="w-full max-w-[240px] overflow-hidden">
              <img
                src={studioImg}
                alt="Detalhe arquitetônico em concreto aparente"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right column — large statement */}
          <div className="md:col-span-8 md:col-start-5 flex flex-col justify-end">
            <p data-reveal className="text-[13px] md:text-[14px] text-[#6d8f6f] leading-[1.7] max-w-lg mb-20 md:mb-28">
              Conectamos, criamos e construímos em territórios que carregam significado. Reconhecemos a história, a cultura e as conexões de cada lugar — e prestamos nosso respeito ao que veio antes e ao que virá depois.
            </p>
            <h2 data-reveal-text className="font-display text-[clamp(2.2rem,5.5vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-[#1a1a1a]">
              Somos um estúdio de Arquitetura &amp;&nbsp;Construção, desenvolvendo projetos residenciais premium em todo o&nbsp;Brasil.
            </h2>
          </div>
        </div>
      </section>

      {/* ─── SELECTED WORKS ─── */}
      <section className="pb-48 md:pb-64 lg:pb-80">
        {/* Section header */}
        <div className="px-8 md:px-16 lg:px-20 mb-24 md:mb-40">
          <div className="flex items-start justify-between">
            <div>
              <span data-reveal className="text-[10px] tracking-[0.25em] text-[#a9ce99] uppercase block mb-4">
                Projetos selecionados
              </span>
            </div>
            <span data-reveal className="text-[11px] text-[#a9ce99]/60 tracking-wider hidden md:block">
              {projects.length.toString().padStart(2, "0")} — 25'
            </span>
          </div>
        </div>

        {/* Projects — each one full-width, editorial, dramatic */}
        <div className="space-y-48 md:space-y-64">
          {projects.map((p, i) => (
            <article key={p.name} className="group">
              {/* Project title — oversized, centered */}
              <div className="px-8 md:px-16 lg:px-20 mb-12 md:mb-16">
                <div data-reveal-text className="flex items-center justify-center">
                  <span className="font-display text-[clamp(3rem,8vw,9rem)] font-bold tracking-[-0.04em] text-[#1a1a1a] leading-[0.9] text-center">
                    <span className="inline-block text-[#a9ce99]/40 font-light mr-2 md:mr-4">[</span>
                    {p.name}
                    <span className="inline-block text-[#a9ce99]/40 font-light ml-2 md:ml-4">]</span>
                  </span>
                </div>
              </div>

              {/* Project image — large, centered */}
              <div className="px-8 md:px-[12%] lg:px-[16%]">
                <div data-img-reveal className="overflow-hidden cursor-pointer">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-auto object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Project metadata */}
              <div className="flex items-center justify-between px-8 md:px-[12%] lg:px-[16%] mt-6 md:mt-8">
                <span className="text-[12px] text-[#6d8f6f] tracking-wide">{p.type}</span>
                <span className="text-[12px] text-[#6d8f6f]/60 tracking-wider">{p.year}</span>
              </div>
            </article>
          ))}
        </div>

        {/* View all */}
        <div className="px-8 md:px-16 lg:px-20 mt-32 md:mt-48">
          <Link
            to="/empreendimentos"
            data-reveal
            className="inline-flex items-center gap-4 text-[13px] font-medium text-[#276233] hover:text-[#348846] transition-colors duration-300 tracking-wide group/link"
          >
            Ver todos os projetos
            <span className="inline-block transition-transform duration-500 group-hover/link:translate-x-2">→</span>
          </Link>
        </div>
      </section>

      {/* ─── VISION ─── */}
      <section className="relative">
        <div className="relative min-h-[120vh]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url(${visionBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/75" />

          <div className="relative z-10 px-8 md:px-16 lg:px-20 py-48 md:py-64">
            {/* Section label */}
            <div className="flex items-center justify-between mb-24 md:mb-40">
              <span data-reveal className="text-[10px] tracking-[0.25em] text-[#a9ce99] uppercase">Visão</span>
              <span data-reveal className="text-[10px] tracking-[0.25em] text-[#a9ce99]/40 uppercase hidden md:block">Vision</span>
            </div>

            {/* Horizontal scrolling words — mimicking the reference */}
            <div data-reveal className="mb-32 md:mb-48 overflow-hidden">
              <div className="flex items-center gap-12 md:gap-24 whitespace-nowrap">
                <span className="font-display text-[clamp(3rem,7vw,7rem)] font-bold text-white/20 tracking-[-0.03em]">Integridade</span>
                <span className="font-display text-[clamp(3rem,7vw,7rem)] font-bold text-white tracking-[-0.03em]">Inovação</span>
                <span className="font-display text-[clamp(3rem,7vw,7rem)] font-bold text-white/20 tracking-[-0.03em]">Experiência ampliada</span>
              </div>
            </div>

            {/* Principles — editorial layout */}
            <div className="space-y-32 md:space-y-48 max-w-6xl">
              {principles.map((p) => (
                <div key={p.num} data-reveal className="grid md:grid-cols-12 gap-6 md:gap-8">
                  <div className="md:col-span-1">
                    <span className="text-[10px] tracking-[0.25em] text-[#a9ce99]">{p.num}</span>
                  </div>
                  <div className="md:col-span-4">
                    <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.05] tracking-[-0.02em]">
                      {p.title}
                    </h3>
                  </div>
                  <div className="md:col-span-5 md:col-start-8">
                    <p className="text-[14px] md:text-[15px] text-white/65 leading-[1.8]">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── METHOD ─── */}
      <section className="py-48 md:py-64 lg:py-80 px-8 md:px-16 lg:px-20 bg-white">
        <div className="max-w-6xl">
          <span data-reveal className="text-[10px] tracking-[0.25em] text-[#a9ce99] uppercase block mb-8">
            Método
          </span>
          <h2 data-reveal-text className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-[-0.03em] text-[#1a1a1a] mb-28 md:mb-40 max-w-3xl leading-[1.05]">
            Um processo que valoriza cada etapa, do primeiro traço à vivência plena.
          </h2>
        </div>

        <div data-steps-container className="border-t border-[#e0e0e0] max-w-5xl">
          {steps.map((s) => (
            <div
              key={s.num}
              data-step
              className="flex items-center justify-between py-8 md:py-10 border-b border-[#e0e0e0] group cursor-default transition-colors duration-500 hover:border-[#276233]/20"
            >
              <div className="flex items-baseline gap-8 md:gap-16">
                <span className="text-[11px] text-[#a9ce99] tracking-[0.2em] font-medium w-8 tabular-nums">
                  {s.num}
                </span>
                <span className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold text-[#1a1a1a] group-hover:text-[#276233] transition-colors duration-500 tracking-[-0.01em]">
                  {s.label}
                </span>
              </div>
              <span className="text-[#276233] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-4px] group-hover:translate-x-0 text-sm">
                →
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CONTACT CTA ─── */}
      <section className="py-48 md:py-64 lg:py-80 px-8 md:px-16 lg:px-20 bg-[#fafcf8]">
        <div className="max-w-5xl">
          <p data-reveal className="text-[11px] text-[#a9ce99] mb-8 tracking-[0.2em] uppercase">
            Fale sobre o seu projeto
          </p>
          <h2 data-reveal-text className="font-display text-[clamp(3rem,7vw,7rem)] font-bold tracking-[-0.03em] text-[#1a1a1a] leading-[0.95] mb-12">
            Vamos conversar
          </h2>
          <Link
            to="/site/contato"
            data-reveal
            className="inline-block font-display text-xl md:text-2xl font-semibold text-[#276233] border-b-2 border-[#276233] pb-2 hover:text-[#348846] hover:border-[#348846] transition-colors duration-500"
          >
            Entre em contato
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#111111] text-white">
        <div className="px-8 md:px-16 lg:px-20 pt-32 md:pt-48 pb-8">
          {/* Top section */}
          <div className="grid md:grid-cols-12 gap-16 md:gap-8 mb-32 md:mb-48">
            {/* CTA */}
            <div className="md:col-span-5">
              <p className="text-[11px] text-white/30 mb-6 tracking-[0.2em] uppercase">
                Fale sobre o seu projeto
              </p>
              <Link
                to="/site/contato"
                className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.05] tracking-[-0.02em] border-b border-white/30 pb-2 hover:text-[#a9ce99] hover:border-[#a9ce99] transition-colors duration-500 inline-block"
              >
                Entre em contato
              </Link>
            </div>

            {/* Nav */}
            <div className="md:col-span-2 md:col-start-8">
              <nav className="flex flex-col gap-4">
                {["Início", "Projetos", "Estúdio", "Processo", "Contato"].map((item) => (
                  <Link
                    key={item}
                    to={item === "Contato" ? "/site/contato" : item === "Projetos" ? "/empreendimentos" : "/site"}
                    className="text-[13px] text-white/40 hover:text-white transition-colors duration-300"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Contact info */}
            <div className="md:col-span-3 md:col-start-10">
              <div className="space-y-6 text-[13px] text-white/40">
                <div>
                  <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] block mb-2">L</span>
                  Rua das Palmeiras, 200<br />
                  São Paulo<br />
                  Brasil, 01234-000
                </div>
                <div>
                  <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] block mb-2">T</span>
                  +55 11 3456 7890
                </div>
                <div>
                  <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] block mb-2">E</span>
                  contato@construtora.com.br
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border-t border-white/8 pt-8 mb-12">
            <span className="text-[12px] text-white/30">Assine nossa newsletter</span>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[12px] text-white/30 hover:text-white/60 transition-colors duration-300">Instagram</a>
              <span className="text-white/10">,</span>
              <a href="#" className="text-[12px] text-white/30 hover:text-white/60 transition-colors duration-300">LinkedIn</a>
            </div>
          </div>

          {/* Large brand watermark */}
          <div data-footer-brand className="overflow-hidden mt-8">
            <h2 className="font-display text-[clamp(5rem,18vw,16rem)] font-bold tracking-[-0.04em] text-white/[0.06] uppercase leading-[0.85] whitespace-nowrap select-none">
              Construtora
            </h2>
          </div>

          {/* Bottom legal */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6 pt-6 border-t border-white/5">
            <span className="text-[10px] text-white/20">
              © {new Date().getFullYear()} Construtora. Todos os direitos reservados.
            </span>
            <div className="flex items-center gap-6 text-[10px] text-white/20">
              <a href="#" className="hover:text-white/40 transition-colors duration-300">Política de privacidade</a>
              <a href="#" className="hover:text-white/40 transition-colors duration-300">Termos de uso</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
