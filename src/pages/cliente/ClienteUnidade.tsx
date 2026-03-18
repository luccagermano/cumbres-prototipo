import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Building, MapPin, Bed, Bath, Car, Maximize2, Layers } from "lucide-react";
import { useCustomerUnit, useCustomerContracts, useCustomerJourneyEvents } from "@/hooks/useCustomerData";
import { Timeline } from "@/components/ui/timeline";
import { StatusChip } from "@/components/ui/status-chip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClienteUnidade() {
  const { data: unitMemberships, isLoading } = useCustomerUnit();
  const { data: contracts } = useCustomerContracts();
  const { data: journeyEvents } = useCustomerJourneyEvents();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Minha Unidade" breadcrumb={["Portal do Cliente", "Minha Unidade"]} />
        <div className="glass-card p-12 text-center text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  const membership = unitMemberships?.[0];
  const unit = membership?.unit as any;

  if (!unit) {
    return (
      <div>
        <PageHeader title="Minha Unidade" breadcrumb={["Portal do Cliente", "Minha Unidade"]} />
        <EmptyState icon={Building} title="Nenhuma unidade vinculada" description="Sua unidade aparecerá aqui quando estiver cadastrada no sistema." />
      </div>
    );
  }

  const block = unit.block;
  const dev = block?.development;
  const contract = contracts?.[0];
  const now = new Date();

  const timelineItems = (journeyEvents ?? []).map((e: any) => ({
    title: e.title,
    description: e.description ?? undefined,
    date: e.event_date ? format(new Date(e.event_date), "dd MMM yyyy", { locale: ptBR }) : undefined,
    status: (e.event_date && new Date(e.event_date) <= now ? "completed" : "pending") as "completed" | "pending",
  }));

  const specs = [
    { icon: Bed, label: "Quartos", value: unit.bedrooms },
    { icon: Bath, label: "Banheiros", value: unit.bathrooms },
    { icon: Car, label: "Vagas", value: unit.parking_spots },
    { icon: Maximize2, label: "Área Privativa", value: unit.private_area_m2 ? `${unit.private_area_m2} m²` : null },
    { icon: Layers, label: "Andar", value: unit.floor_label },
  ].filter((s) => s.value != null);

  return (
    <div>
      <PageHeader
        title={`Unidade ${unit.code}`}
        description={dev ? `${dev.name} — Bloco ${block.name}` : `Bloco ${block.name}`}
        breadcrumb={["Portal do Cliente", "Minha Unidade"]}
      />

      {/* Unit Info Card */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{dev?.name ?? "Empreendimento"}</h2>
            {dev?.address_line && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {[dev.address_line, dev.neighborhood, dev.city, dev.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          {unit.commercial_status && <StatusChip status={unit.commercial_status} />}
        </div>

        {specs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
            {specs.map((s) => (
              <div key={s.label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <s.icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-semibold text-foreground">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Summary */}
      {contract && (
        <div className="glass-card p-6 mb-6">
          <h3 className="font-display font-semibold text-foreground mb-3">Contrato</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Número</p>
              <p className="font-medium text-foreground">{contract.contract_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <StatusChip status={contract.contract_status} />
            </div>
            <div>
              <p className="text-muted-foreground">Valor Total</p>
              <p className="font-medium text-foreground">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(contract.total_contract_value))}
              </p>
            </div>
            {contract.bank_name && (
              <div>
                <p className="text-muted-foreground">Banco</p>
                <p className="font-medium text-foreground">{contract.bank_name}</p>
              </div>
            )}
            {contract.financing_status && (
              <div>
                <p className="text-muted-foreground">Financiamento</p>
                <StatusChip status={contract.financing_status} />
              </div>
            )}
            {contract.signed_at && (
              <div>
                <p className="text-muted-foreground">Assinado em</p>
                <p className="font-medium text-foreground">{format(new Date(contract.signed_at), "dd/MM/yyyy")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Journey Timeline */}
      {timelineItems.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Jornada da Compra</h3>
          <Timeline items={timelineItems} />
        </div>
      )}
    </div>
  );
}
