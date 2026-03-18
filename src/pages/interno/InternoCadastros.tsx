import { motion } from "framer-motion";
import {
  Building2, Layers, Home, Users, FileSignature, UserCog,
  ArrowRight, AlertCircle, CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { PageSkeleton, CardGridSkeleton } from "@/components/ui/page-skeleton";

type CadastroCard = {
  title: string;
  description: string;
  icon: typeof Building2;
  count: number | null;
  loading: boolean;
  emptyWarning: string;
  href: string;
};

type Section = {
  title: string;
  cards: CadastroCard[];
};

export default function InternoCadastros() {
  const { user, isPlatformAdmin } = useAuth();

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
      const { data } = await supabase.from("blocks").select("id");
      return data ?? [];
    },
  });

  const { data: units, isLoading: loadUnits } = useQuery({
    queryKey: ["cadastros-units"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id");
      return data ?? [];
    },
  });

  const { data: unitMemberships, isLoading: loadClients } = useQuery({
    queryKey: ["cadastros-clients"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("unit_memberships").select("id").eq("active", true);
      return data ?? [];
    },
  });

  const { data: contracts, isLoading: loadContracts } = useQuery({
    queryKey: ["cadastros-contracts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("sales_contracts").select("id");
      return data ?? [];
    },
  });

  const { data: orgMembers, isLoading: loadTeam } = useQuery({
    queryKey: ["cadastros-team"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("organization_memberships").select("id, role").eq("active", true);
      return data ?? [];
    },
  });

  const anyLoading = loadDev || loadBlocks || loadUnits || loadClients || loadContracts || loadTeam;

  // ── Sections ─────────────────────────────────────────────
  const sections: Section[] = [
    {
      title: "Cadastros Estruturais",
      cards: [
        {
          title: "Empreendimentos",
          description: "Empreendimentos imobiliários da carteira",
          icon: Building2,
          count: developments?.length ?? null,
          loading: loadDev,
          emptyWarning: "Nenhum empreendimento cadastrado",
          href: "/interno/cadastros/empreendimentos",
        },
        {
          title: "Blocos / Torres",
          description: "Blocos e torres de cada empreendimento",
          icon: Layers,
          count: blocks?.length ?? null,
          loading: loadBlocks,
          emptyWarning: "Nenhum bloco cadastrado",
          href: "/interno/cadastros/blocos",
        },
        {
          title: "Unidades",
          description: "Unidades residenciais e comerciais",
          icon: Home,
          count: units?.length ?? null,
          loading: loadUnits,
          emptyWarning: "Nenhuma unidade cadastrada",
          href: "/interno/cadastros/unidades",
        },
      ],
    },
    {
      title: "Cadastros Comerciais",
      cards: [
        {
          title: "Contratos",
          description: "Contratos de venda ativos e finalizados",
          icon: FileSignature,
          count: contracts?.length ?? null,
          loading: loadContracts,
          emptyWarning: "Nenhum contrato criado",
          href: "/interno/cadastros/contratos",
        },
      ],
    },
    {
      title: "Cadastros de Acesso",
      cards: [
        {
          title: "Clientes",
          description: "Proprietários e moradores vinculados a unidades",
          icon: Users,
          count: unitMemberships?.length ?? null,
          loading: loadClients,
          emptyWarning: "Nenhum cliente vinculado",
          href: "/interno/cadastros/clientes",
        },
        {
          title: "Equipe",
          description: "Membros internos e seus papéis nas organizações",
          icon: UserCog,
          count: orgMembers?.length ?? null,
          loading: loadTeam,
          emptyWarning: "Nenhum membro cadastrado",
          href: "/interno/cadastros/equipe",
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

  // ── KPIs ─────────────────────────────────────────────────
  const kpis = [
    { title: "Empreendimentos", value: developments?.length ?? 0, icon: Building2 },
    { title: "Unidades", value: units?.length ?? 0, icon: Home },
    { title: "Contratos", value: contracts?.length ?? 0, icon: FileSignature },
    { title: "Clientes Vinculados", value: unitMemberships?.length ?? 0, icon: Users },
  ];

  if (anyLoading) {
    return (
      <div>
        <PageHeader
          title="Cadastros"
          description="Hub de dados mestres da plataforma."
          breadcrumb={["Interno", "Cadastros"]}
        />
        <CardGridSkeleton count={4} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Cadastros"
        description="Hub de dados mestres da plataforma. Gerencie a estrutura organizacional, comercial e operacional."
        breadcrumb={["Interno", "Cadastros"]}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} />
          </motion.div>
        ))}
      </div>

      {/* Guidance */}
      {isPlatformAdmin && (
        <div className="glass-card p-4 mb-8 border-l-4 border-primary/60">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Modo administrador global.</span>{" "}
            Você está visualizando dados de todas as organizações da plataforma.
          </p>
        </div>
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
