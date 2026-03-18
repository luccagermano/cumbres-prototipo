import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter } from "@/components/ui/chip-filter";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusChip } from "@/components/ui/status-chip";
import { DataTable, DataColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DrawerShell } from "@/components/ui/modal-shell";
import { EmptyState } from "@/components/EmptyState";
import { ClipboardCheck, Plus, Pencil, Loader2, Calendar, BookOpen } from "lucide-react";
import { toast } from "sonner";

const statusFilters = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Inativos", value: "inactive" },
];

type InspectionType = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  code: string | null;
  audience: string | null;
  requires_term_signature: boolean | null;
  default_duration_minutes: number | null;
  active: boolean;
  created_at: string;
};

export default function InternoTiposVistoria() {
  const { user, isPlatformAdmin, memberships } = useAuth();
  const qc = useQueryClient();
  const canWrite = isPlatformAdmin || memberships.some(m => m.active && ["org_admin", "inspection_agent"].includes(m.role));

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["all"]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<InspectionType | null>(null);

  const [form, setForm] = useState({
    name: "", description: "", code: "", audience: "customer",
    requires_term_signature: false, default_duration_minutes: "",
    active: true,
  });

  // ── Queries ──
  const { data: orgs } = useQuery({
    queryKey: ["vistoria-orgs"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name");
      return data ?? [];
    },
  });

  const { data: types, isLoading } = useQuery({
    queryKey: ["inspection-types-mgmt"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("inspection_types").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as InspectionType[];
    },
  });

  const { data: slotCounts } = useQuery({
    queryKey: ["inspection-slot-counts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("inspection_slots").select("inspection_type_id");
      const map = new Map<string, number>();
      data?.forEach((s) => {
        map.set(s.inspection_type_id, (map.get(s.inspection_type_id) ?? 0) + 1);
      });
      return map;
    },
  });

  const { data: bookingCounts } = useQuery({
    queryKey: ["inspection-booking-counts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("inspection_bookings").select("inspection_type_id");
      const map = new Map<string, number>();
      data?.forEach((b) => {
        map.set(b.inspection_type_id, (map.get(b.inspection_type_id) ?? 0) + 1);
      });
      return map;
    },
  });

  // ── Mutation ──
  const upsert = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editing) {
        const { id, organization_id, created_at, ...rest } = payload as Record<string, unknown>;
        const { error } = await supabase.from("inspection_types").update(rest as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inspection_types").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspection-types-mgmt"] });
      qc.invalidateQueries({ queryKey: ["cadastros-inspection-types"] });
      setDrawerOpen(false);
      setEditing(null);
      toast.success(editing ? "Tipo atualizado" : "Tipo criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Filtering ──
  const filtered = useMemo(() => {
    if (!types) return [];
    return types.filter((t) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter.includes("all") ||
        (statusFilter.includes("active") && t.active) ||
        (statusFilter.includes("inactive") && !t.active);
      return matchSearch && matchStatus;
    });
  }, [types, search, statusFilter]);

  const totalTypes = types?.length ?? 0;
  const activeTypes = types?.filter(t => t.active).length ?? 0;
  const totalSlots = slotCounts ? Array.from(slotCounts.values()).reduce((a, b) => a + b, 0) : 0;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", code: "", audience: "customer", requires_term_signature: false, default_duration_minutes: "", active: true });
    setDrawerOpen(true);
  };

  const openEdit = (t: InspectionType) => {
    setEditing(t);
    setForm({
      name: t.name,
      description: t.description ?? "",
      code: t.code ?? "",
      audience: t.audience ?? "customer",
      requires_term_signature: t.requires_term_signature ?? false,
      default_duration_minutes: t.default_duration_minutes?.toString() ?? "",
      active: t.active,
    });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const orgId = editing?.organization_id ?? orgs?.[0]?.id;
    if (!orgId) { toast.error("Nenhuma organização disponível"); return; }
    upsert.mutate({
      ...(editing ? {} : { organization_id: orgId }),
      name: form.name.trim(),
      description: form.description.trim() || null,
      code: form.code.trim() || null,
      audience: form.audience,
      requires_term_signature: form.requires_term_signature,
      default_duration_minutes: form.default_duration_minutes ? parseInt(form.default_duration_minutes) : null,
      active: form.active,
    });
  };

  const orgName = (orgId: string) => orgs?.find(o => o.id === orgId)?.name ?? "—";

  const columns: DataColumn<InspectionType>[] = [
    {
      key: "name",
      header: "Nome",
      render: (row) => (
        <div>
          <span className="font-medium text-foreground">{row.name}</span>
          {row.code && <span className="text-[11px] text-muted-foreground ml-2">({row.code})</span>}
        </div>
      ),
    },
    {
      key: "organization_id",
      header: "Organização",
      render: (row) => <span className="text-muted-foreground text-xs">{orgName(row.organization_id)}</span>,
    },
    {
      key: "audience",
      header: "Público",
      render: (row) => (
        <StatusChip
          variant="info"
          label={row.audience === "customer" ? "Cliente" : row.audience === "internal" ? "Interno" : "Todos"}
          size="sm"
          dot={false}
        />
      ),
    },
    {
      key: "slots",
      header: "Slots",
      render: (row) => <span className="text-xs text-muted-foreground">{slotCounts?.get(row.id) ?? 0}</span>,
    },
    {
      key: "bookings",
      header: "Agendamentos",
      render: (row) => <span className="text-xs text-muted-foreground">{bookingCounts?.get(row.id) ?? 0}</span>,
    },
    {
      key: "active",
      header: "Status",
      render: (row) => <StatusChip variant={row.active ? "success" : "neutral"} label={row.active ? "Ativo" : "Inativo"} size="sm" />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (row) => (
        <Button variant="ghost" size="sm" className="h-7" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
          <Pencil className="h-3 w-3" />
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Tipos de Vistoria" breadcrumb={["Interno", "Cadastros", "Tipos de Vistoria"]} />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tipos de Vistoria"
        description="Gerencie os tipos de vistoria disponíveis para agendamento."
        breadcrumb={["Interno", "Cadastros", "Tipos de Vistoria"]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo Tipo
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard title="Tipos" value={totalTypes} icon={ClipboardCheck} />
        <KpiCard title="Ativos" value={activeTypes} icon={ClipboardCheck} />
        <KpiCard title="Slots Criados" value={totalSlots} icon={Calendar} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar tipo..." className="flex-1" />
        <ChipFilter options={statusFilters} selected={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nenhum tipo de vistoria encontrado"
          description="Crie tipos como: vistoria de entrega, vistoria técnica, vistoria pós-obra."
          action={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Novo Tipo</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          onRowClick={openEdit}
        />
      )}

      {/* Drawer */}
      <DrawerShell
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Editar Tipo de Vistoria" : "Novo Tipo de Vistoria"}
        footer={
          <>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Vistoria de Entrega" />
            <p className="text-[11px] text-muted-foreground mt-1">Exemplos: vistoria de entrega, vistoria técnica, vistoria pós-obra</p>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição operacional do tipo" rows={3} />
          </div>
          <div>
            <Label>Código</Label>
            <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="Ex: VE, VT" />
          </div>
          <div>
            <Label>Público-alvo</Label>
            <Select value={form.audience} onValueChange={(v) => setForm(p => ({ ...p, audience: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Cliente</SelectItem>
                <SelectItem value="internal">Interno</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Duração padrão (minutos)</Label>
            <Input type="number" value={form.default_duration_minutes} onChange={(e) => setForm(p => ({ ...p, default_duration_minutes: e.target.value }))} placeholder="Ex: 30" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.requires_term_signature} onCheckedChange={(v) => setForm(p => ({ ...p, requires_term_signature: v }))} />
            <Label>Requer assinatura de termo</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.active} onCheckedChange={(v) => setForm(p => ({ ...p, active: v }))} />
            <Label>Ativo</Label>
          </div>
        </div>
      </DrawerShell>
    </div>
  );
}
