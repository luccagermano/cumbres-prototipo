import { motion } from "framer-motion";
import {
  Building2, Layers, Home, Users, FileSignature, UserCog, Landmark,
  ArrowRight, AlertCircle, CheckCircle2, AlertTriangle, Info, Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { PageSkeleton, CardGridSkeleton } from "@/components/ui/page-skeleton";

type CadastroCard = {
  title: string;
  description: string;
  icon: typeof Building2;
  count: number | null;
  loading: boolean;
  emptyWarning: string;
  href: string;
  readiness?: "ready" | "warning" | "empty";
  readinessLabel?: string;
};

type Section = {
  title: string;
  cards: CadastroCard[];
};

type DiagnosticItem = {
  icon: typeof AlertTriangle;
  variant: "warning" | "info";
  message: string;
  action: string;
  href: string;
};

export default function InternoCadastros() {
  const { user, isPlatformAdmin, memberships } = useAuth();

  const isAdmin = isPlatformAdmin || memberships.some((m) => m.role === "org_admin" && m.active);

  // ── Queries ──────────────────────────────────────────────
  const { data: developments, isLoading: loadDev } = useQuery({
    queryKey: ["cadastros-developments"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("developments").select("id");
      return data ?? [];
    },
  });

  const { data: blocks, isLoading: loadBlocks } = useQuery({
    queryKey: ["cadastros-blocks"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("id, development_id");
      return data ?? [];
    },
  });

  const { data: units, isLoading: loadUnits } = useQuery({
    queryKey: ["cadastros-units"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id, block_id, commercial_status");
      return data ?? [];
    },
  });

  const { data: unitMemberships, isLoading: loadClients } = useQuery({
    queryKey: ["cadastros-clients"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("unit_memberships").select("id, unit_id, active, is_primary").eq("active", true);
      return data ?? [];
    },
  });

  const { data: contracts, isLoading: loadContracts } = useQuery({
    queryKey: ["cadastros-contracts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("sales_contracts").select("id, unit_id, contract_status, signed_at");
      return data ?? [];
    },
  });

  const { data: orgMembers, isLoading: loadTeam } = useQuery({
    queryKey: ["cadastros-team"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("organization_memberships").select("id, role, active").eq("active", true);
      return data ?? [];
    },
  });

  const { data: orgs, isLoading: loadOrgs } = useQuery({
    queryKey: ["cadastros-organizations"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, active");
      return data ?? [];
    },
  });

  const anyLoading = loadDev || loadBlocks || loadUnits || loadClients || loadContracts || loadTeam || loadOrgs;

  // ── Derived Counts ──
  const devCount = developments?.length ?? 0;
  const blockCount = blocks?.length ?? 0;
  const unitCount = units?.length ?? 0;
  const clientCount = unitMemberships ? new Set(unitMemberships.map(m => m.unit_id)).size : 0;
  const contractCount = contracts?.length ?? 0;
  const teamCount = orgMembers?.filter(m => m.role !== "customer")?.length ?? 0;
  const orgCount = orgs?.length ?? 0;
  const orgActiveCount = orgs?.filter(o => o.active).length ?? 0;

  // ── Readiness computations ──
  const devsWithBlocks = blocks ? new Set(blocks.map(b => b.development_id)).size : 0;
  const devsWithoutBlocks = devCount - devsWithBlocks;
  const blocksWithUnits = units ? new Set(units.map(u => u.block_id)).size : 0;
  const blocksWithoutUnits = blockCount - blocksWithUnits;
  const unitIdsWithClients = unitMemberships ? new Set(unitMemberships.map(m => m.unit_id)) : new Set<string>();
  const unitIdsWithContracts = contracts ? new Set(contracts.map(c => c.unit_id)) : new Set<string>();
  const soldUnits = units?.filter(u => u.commercial_status === "sold" || u.commercial_status === "handed_over") ?? [];
  const soldWithoutContract = soldUnits.filter(u => !unitIdsWithContracts.has(u.id)).length;
  const soldWithoutClient = soldUnits.filter(u => !unitIdsWithClients.has(u.id)).length;
  const contractsWithoutClient = contracts?.filter(c => !unitIdsWithClients.has(c.unit_id)).length ?? 0;

  // ── Diagnostics ──
  const diagnostics: DiagnosticItem[] = [];
  if (!anyLoading) {
    if (devCount === 0) {
      diagnostics.push({ icon: AlertTriangle, variant: "warning", message: "Nenhum empreendimento cadastrado. Comece criando a estrutura base.", action: "Criar empreendimento", href: "/interno/cadastros/empreendimentos" });
    }
    if (devCount > 0 && devsWithoutBlocks > 0) {
      diagnostics.push({ icon: AlertTriangle, variant: "warning", message: `${devsWithoutBlocks} empreendimento(s) sem blocos cadastrados.`, action: "Ver blocos", href: "/interno/cadastros/blocos" });
    }
    if (blockCount > 0 && blocksWithoutUnits > 0) {
      diagnostics.push({ icon: AlertTriangle, variant: "warning", message: `${blocksWithoutUnits} bloco(s) sem unidades cadastradas.`, action: "Ver unidades", href: "/interno/cadastros/unidades" });
    }
    if (soldWithoutContract > 0) {
      diagnostics.push({ icon: AlertTriangle, variant: "warning", message: `${soldWithoutContract} unidade(s) vendida(s) sem contrato vinculado.`, action: "Ver contratos", href: "/interno/cadastros/contratos" });
    }
    if (soldWithoutClient > 0) {
      diagnostics.push({ icon: Info, variant: "info", message: `${soldWithoutClient} unidade(s) vendida(s) sem cliente vinculado.`, action: "Ver clientes", href: "/interno/cadastros/clientes" });
    }
    if (contractsWithoutClient > 0) {
      diagnostics.push({ icon: Info, variant: "info", message: `${contractsWithoutClient} contrato(s) sem cliente principal vinculado à unidade.`, action: "Ver clientes", href: "/interno/cadastros/clientes" });
    }
    if (teamCount === 0 && devCount > 0) {
      diagnostics.push({ icon: AlertTriangle, variant: "warning", message: "Nenhum membro interno configurado. Adicione a equipe operacional.", action: "Ver equipe", href: "/interno/cadastros/equipe" });
    }
  }

  // ── Readiness helpers ──
  const getReadiness = (count: number | null, depReady: boolean): { readiness: "ready" | "warning" | "empty"; label: string } => {
    if (count === null || count === 0) return { readiness: "empty", label: "Vazio" };
    if (!depReady) return { readiness: "warning", label: "Pendências" };
    return { readiness: "ready", label: "Configurado" };
  };

  // ── Sections ─────────────────────────────────────────────
  const sections: Section[] = [
    {
      title: "Cadastros Estruturais",
      cards: [
        {
          title: "Empreendimentos",
          description: "Base da hierarquia: organização › empreendimento › bloco › unidade",
          icon: Building2,
          count: devCount,
          loading: loadDev,
          emptyWarning: "Nenhum empreendimento cadastrado",
          href: "/interno/cadastros/empreendimentos",
          ...getReadiness(devCount, devsWithoutBlocks === 0),
        },
        {
          title: "Blocos / Torres",
          description: "Estrutura intermediária vinculada a empreendimentos",
          icon: Layers,
          count: blockCount,
          loading: loadBlocks,
          emptyWarning: "Nenhum bloco cadastrado",
          href: "/interno/cadastros/blocos",
          ...getReadiness(blockCount, blocksWithoutUnits === 0),
          readinessLabel: blocksWithoutUnits > 0 ? `${blocksWithoutUnits} sem unidades` : blockCount > 0 ? "Configurado" : "Vazio",
        },
        {
          title: "Unidades",
          description: "Unidades residenciais e comerciais dos empreendimentos",
          icon: Home,
          count: unitCount,
          loading: loadUnits,
          emptyWarning: "Nenhuma unidade cadastrada",
          href: "/interno/cadastros/unidades",
          ...getReadiness(unitCount, soldWithoutContract === 0 && soldWithoutClient === 0),
        },
      ],
    },
    {
      title: "Cadastros Comerciais",
      cards: [
        {
          title: "Contratos",
          description: "Contratos de venda: contrato › unidade › cliente",
          icon: FileSignature,
          count: contractCount,
          loading: loadContracts,
          emptyWarning: "Nenhum contrato criado",
          href: "/interno/cadastros/contratos",
          ...getReadiness(contractCount, contractsWithoutClient === 0),
          readinessLabel: contractsWithoutClient > 0 ? `${contractsWithoutClient} sem cliente` : contractCount > 0 ? "Configurado" : "Vazio",
        },
      ],
    },
    {
      title: "Cadastros de Acesso",
      cards: [
        {
          title: "Clientes",
          description: "Vínculo: cliente › unidade › bloco › empreendimento",
          icon: Users,
          count: clientCount,
          loading: loadClients,
          emptyWarning: "Nenhum cliente vinculado",
          href: "/interno/cadastros/clientes",
          ...getReadiness(clientCount, true),
        },
        {
          title: "Equipe",
          description: "Gestão: organização › membro › papel de acesso",
          icon: UserCog,
          count: teamCount,
          loading: loadTeam,
          emptyWarning: "Nenhum membro cadastrado",
          href: "/interno/cadastros/equipe",
          ...getReadiness(teamCount, true),
        },
      ],
    },
    {
      title: "Cadastros Operacionais",
      cards: [
        {
          title: "Garantias",
          description: "Regras de garantia e prazos por categoria",
          icon: Building2,
          count: null,
          loading: false,
          emptyWarning: "",
          href: "/interno/garantia",
        },
      ],
    },
  ];

  // ── KPIs ─────────────────────────────────────────────
  const kpis = [
    { title: "Empreendimentos", value: devCount, icon: Building2 },
    { title: "Blocos", value: blockCount, icon: Layers },
    { title: "Unidades", value: unitCount, icon: Home },
    { title: "Contratos", value: contractCount, icon: FileSignature },
    { title: "Clientes", value: clientCount, icon: Users },
    { title: "Equipe Interna", value: teamCount, icon: UserCog },
  ];

  if (anyLoading) {
    return (
      <div>
        <PageHeader
          title="Cadastros"
          description="Hub de dados mestres da plataforma."
          breadcrumb={["Interno", "Cadastros"]}
        />
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  const readinessChip: Record<string, { variant: "success" | "warning" | "neutral"; label: string }> = {
    ready: { variant: "success", label: "Configurado" },
    warning: { variant: "warning", label: "Pendências" },
    empty: { variant: "neutral", label: "Vazio" },
  };

  return (
    <div>
      <PageHeader
        title="Cadastros"
        description="Hub de dados mestres da plataforma. Gerencie a estrutura organizacional, comercial e operacional."
        breadcrumb={["Interno", "Cadastros"]}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} />
          </motion.div>
        ))}
      </div>

      {/* Onboarding CTA — only for admins */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <Link to="/interno/cadastros/onboarding-cliente" className="block">
            <div className="glass-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Onboarding de Cliente
                </p>
                <p className="text-xs text-muted-foreground">
                  Assistente guiado para configurar empreendimento, unidade, cliente, vínculo e contrato em um único fluxo.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Diagnostics Panel */}
      {diagnostics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 mb-8 border-l-4 border-amber-400/60"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="font-display text-sm font-semibold text-foreground">Diagnóstico de Configuração</h3>
            <span className="text-[11px] text-muted-foreground ml-auto">{diagnostics.length} pendência(s)</span>
          </div>
          <div className="space-y-2">
            {diagnostics.map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <d.icon className={`h-3.5 w-3.5 flex-shrink-0 ${d.variant === "warning" ? "text-amber-500" : "text-blue-500"}`} />
                  <span className="text-sm text-foreground">{d.message}</span>
                </div>
                <Link to={d.href}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 flex-shrink-0">
                    {d.action} <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Guidance */}
      {isPlatformAdmin && (
        <div className="glass-card p-4 mb-8 border-l-4 border-primary/60">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Modo administrador global.</span>{" "}
            Você está visualizando dados de todas as organizações da plataforma.
          </p>
        </div>
      )}

      {/* Setup guidance for empty state */}
      {devCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 mb-8 text-center"
        >
          <div className="p-3 rounded-2xl bg-primary/10 w-fit mx-auto mb-4">
            <Info className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-base font-semibold text-foreground mb-2">Comece a configurar sua operação</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            A estrutura segue a hierarquia: <span className="font-medium text-foreground">Organização → Empreendimento → Bloco → Unidade</span>. 
            Depois, vincule clientes e contratos às unidades.
          </p>
          <Link to="/interno/cadastros/empreendimentos">
            <Button size="sm" className="gap-1.5">
              <Building2 className="h-4 w-4" /> Criar Primeiro Empreendimento
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Sections */}
      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="font-display text-base font-semibold text-foreground mb-4 tracking-tight">
              {section.title}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.cards.map((card, i) => {
                const isEmpty = card.count !== null && card.count === 0;
                const chipData = card.readiness ? readinessChip[card.readiness] : null;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <div className="glass-card p-5 flex flex-col h-full group hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                          <card.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          {chipData && (
                            <StatusChip
                              variant={chipData.variant}
                              label={card.readinessLabel ?? chipData.label}
                              size="sm"
                            />
                          )}
                          {card.count !== null && (
                            <div className="flex items-center gap-1.5">
                              {isEmpty ? (
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                              <span className="text-xs font-medium text-muted-foreground">
                                {card.count}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="font-display font-semibold text-sm text-foreground mb-0.5">
                        {card.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4 flex-1">
                        {card.description}
                      </p>

                      {isEmpty && (
                        <p className="text-[11px] text-amber-600 font-medium mb-3 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {card.emptyWarning}
                        </p>
                      )}

                      <Link to={card.href}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs gap-1.5"
                        >
                          Gerenciar
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
