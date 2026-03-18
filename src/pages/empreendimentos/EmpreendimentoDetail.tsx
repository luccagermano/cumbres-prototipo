import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/ui/glass-card";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Building, MapPin, Calendar, Home, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EmpreendimentoDetail() {
  const { slug } = useParams();

  const { data: dev, isLoading } = useQuery({
    queryKey: ["development-detail", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developments")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: blocks } = useQuery({
    queryKey: ["development-blocks", dev?.id],
    enabled: !!dev,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocks")
        .select("*, units:units(count)")
        .eq("development_id", dev!.id)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <PageHeader title="Empreendimento" breadcrumb={["Empreendimentos", "Carregando..."]} />
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!dev) {
    return (
      <div className="container py-12">
        <PageHeader title="Empreendimento" breadcrumb={["Empreendimentos", slug || "Detalhe"]} />
        <EmptyState icon={Building} title="Empreendimento não encontrado" description="O empreendimento solicitado não foi encontrado ou ainda não está disponível." />
      </div>
    );
  }

  const statusVariant = dev.launch_status === "launched" ? "success" : dev.launch_status === "pre_launch" ? "warning" : "info";
  const statusLabel = dev.launch_status === "launched" ? "Lançado" : dev.launch_status === "pre_launch" ? "Pré-lançamento" : dev.launch_status || "—";

  return (
    <div className="container py-12">
      <PageHeader title={dev.name} breadcrumb={["Empreendimentos", dev.name]} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard title="Status" value={statusLabel} icon={Building} />
        <KpiCard title="Total de Unidades" value={String(dev.total_units ?? "—")} icon={Home} />
        <KpiCard
          title="Previsão de Entrega"
          value={dev.delivery_forecast_at ? format(new Date(dev.delivery_forecast_at), "MMM yyyy", { locale: ptBR }) : "—"}
          icon={Calendar}
        />
      </div>

      <GlassCard className="p-6 mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Localização</h3>
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-primary mt-0.5" />
          <div>
            {dev.address_line && <p className="text-sm text-foreground">{dev.address_line}</p>}
            <p className="text-sm text-muted-foreground">
              {[dev.neighborhood, dev.city, dev.state].filter(Boolean).join(", ")}
              {dev.zip_code && ` — CEP ${dev.zip_code}`}
            </p>
          </div>
        </div>
      </GlassCard>

      {blocks && blocks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Blocos / Torres</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blocks.map((block) => (
              <GlassCard key={block.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{block.name}</span>
                  <StatusChip label={`${(block as any).units?.[0]?.count ?? 0} unid.`} variant="neutral" size="sm" />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
