import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, DataColumn } from "@/components/ui/data-table";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter, ChipFilterOption } from "@/components/ui/chip-filter";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/EmptyState";
import { DrawerShell } from "@/components/ui/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2, Plus, Pencil, Layers, Home, MapPin, Calendar,
  Rocket, HardHat, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Development = Tables<"developments">;
type Organization = Tables<"organizations">;

const STATUS_OPTIONS: ChipFilterOption[] = [
  { label: "Lançamento", value: "launch" },
  { label: "Em obra", value: "construction" },
  { label: "Entregue", value: "delivered" },
  { label: "Pré-lançamento", value: "pre_launch" },
];

const statusVariant: Record<string, { variant: "success" | "warning" | "info" | "neutral" | "pending"; label: string }> = {
  launch: { variant: "info", label: "Lançamento" },
  construction: { variant: "warning", label: "Em obra" },
  delivered: { variant: "success", label: "Entregue" },
  pre_launch: { variant: "pending", label: "Pré-lançamento" },
};

const STATES_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

type FormData = {
  organization_id: string;
  name: string;
  slug: string;
  address_line: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  launch_status: string;
  delivery_forecast_at: string;
  total_units: string;
};

const emptyForm: FormData = {
  organization_id: "",
  name: "",
  slug: "",
  address_line: "",
  neighborhood: "",
  city: "",
  state: "",
  zip_code: "",
  launch_status: "",
  delivery_forecast_at: "",
  total_units: "",
};

export default function InternoEmpreendimentos() {
  const { user, isPlatformAdmin, memberships } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState<string[]>([]);
  const [orgFilter, setOrgFilter] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Development | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const canWrite = isPlatformAdmin || memberships.some((m) => m.role === "org_admin" && m.active);

  // ── Queries ──
  const { data: developments = [], isLoading } = useQuery({
    queryKey: ["interno-empreendimentos"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Development[];
    },
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["interno-organizations"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*").order("name");
      return (data ?? []) as Organization[];
    },
  });

  const { data: blockCounts = {} } = useQuery({
    queryKey: ["interno-dev-block-counts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("development_id");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((b) => {
        counts[b.development_id] = (counts[b.development_id] || 0) + 1;
      });
      return counts;
    },
  });

  const { data: unitCountsByDev = {} } = useQuery({
    queryKey: ["interno-dev-unit-counts"],
    enabled: !!user,
    queryFn: async () => {
      const { data: blocksData } = await supabase.from("blocks").select("id, development_id");
      const { data: unitsData } = await supabase.from("units").select("block_id");
      const blockDevMap: Record<string, string> = {};
      (blocksData ?? []).forEach(b => { blockDevMap[b.id] = b.development_id; });
      const counts: Record<string, number> = {};
      (unitsData ?? []).forEach(u => {
        const devId = blockDevMap[u.block_id];
        if (devId) counts[devId] = (counts[devId] || 0) + 1;
      });
      return counts;
    },
  });

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    organizations.forEach((o) => m.set(o.id, o.name));
    return m;
  }, [organizations]);

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        organization_id: data.organization_id,
        name: data.name.trim(),
        slug: data.slug.trim(),
        address_line: data.address_line.trim() || null,
        neighborhood: data.neighborhood.trim() || null,
        city: data.city.trim() || null,
        state: data.state || null,
        zip_code: data.zip_code.trim() || null,
        launch_status: data.launch_status || null,
        delivery_forecast_at: data.delivery_forecast_at || null,
        total_units: data.total_units ? parseInt(data.total_units, 10) : null,
      };

      if (editing) {
        const { error } = await supabase
          .from("developments")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("developments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Empreendimento atualizado com sucesso." : "Empreendimento criado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["interno-empreendimentos"] });
      queryClient.invalidateQueries({ queryKey: ["cadastros-developments"] });
      closeDrawer();
    },
    onError: (err: Error) => {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        toast.error("Já existe um empreendimento com esse slug nesta organização.");
      } else {
        toast.error("Erro ao salvar empreendimento.");
      }
    },
  });

  // ── Filters ──
  const cities = useMemo(() => [...new Set(developments.map((d) => d.city).filter(Boolean) as string[])].sort(), [developments]);
  const states = useMemo(() => [...new Set(developments.map((d) => d.state).filter(Boolean) as string[])].sort(), [developments]);

  const filtered = useMemo(() => {
    let result = developments;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q) ||
          d.city?.toLowerCase().includes(q) ||
          d.neighborhood?.toLowerCase().includes(q)
      );
    }
    if (statusFilter.length > 0) result = result.filter((d) => d.launch_status && statusFilter.includes(d.launch_status));
    if (stateFilter.length > 0) result = result.filter((d) => d.state && stateFilter.includes(d.state));
    if (cityFilter.length > 0) result = result.filter((d) => d.city && cityFilter.includes(d.city));
    if (orgFilter.length > 0) result = result.filter((d) => orgFilter.includes(d.organization_id));
    return result;
  }, [developments, search, statusFilter, stateFilter, cityFilter, orgFilter]);

  // ── KPIs ──
  const kpis = [
    { title: "Total", value: developments.length, icon: Building2 },
    { title: "Em Lançamento", value: developments.filter((d) => d.launch_status === "launch" || d.launch_status === "pre_launch").length, icon: Rocket },
    { title: "Em Obra", value: developments.filter((d) => d.launch_status === "construction").length, icon: HardHat },
    { title: "Entregues", value: developments.filter((d) => d.launch_status === "delivered").length, icon: CheckCircle2 },
  ];

  // ── Drawer ──
  const openCreate = () => {
    setEditing(null);
    const defaultOrg = !isPlatformAdmin && memberships.length > 0
      ? memberships.find((m) => m.role === "org_admin")?.organization_id ?? memberships[0].organization_id
      : "";
    setForm({ ...emptyForm, organization_id: defaultOrg });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (dev: Development) => {
    setEditing(dev);
    setForm({
      organization_id: dev.organization_id,
      name: dev.name,
      slug: dev.slug,
      address_line: dev.address_line ?? "",
      neighborhood: dev.neighborhood ?? "",
      city: dev.city ?? "",
      state: dev.state ?? "",
      zip_code: dev.zip_code ?? "",
      launch_status: dev.launch_status ?? "",
      delivery_forecast_at: dev.delivery_forecast_at ? dev.delivery_forecast_at.split("T")[0] : "",
      total_units: dev.total_units?.toString() ?? "",
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!form.organization_id) errors.organization_id = "Selecione uma organização.";
    if (!form.name.trim()) errors.name = "Nome é obrigatório.";
    if (!form.slug.trim()) errors.slug = "Slug é obrigatório.";
    else if (!/^[a-z0-9-]+$/.test(form.slug.trim())) errors.slug = "Slug deve conter apenas letras minúsculas, números e hífens.";
    if (form.total_units && (isNaN(Number(form.total_units)) || Number(form.total_units) < 0))
      errors.total_units = "Informe um número válido.";
    if (form.zip_code && !/^\d{5}-?\d{3}$/.test(form.zip_code.trim()))
      errors.zip_code = "CEP inválido (ex: 01001-000).";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    saveMutation.mutate(form);
  };

  const updateField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const autoSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // ── Columns ──
  const columns: DataColumn<Development>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
            <p className="text-[11px] text-muted-foreground">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "organization_id",
      header: "Organização",
      render: (row) => (
        <span className="text-sm text-foreground">{orgMap.get(row.organization_id) ?? "—"}</span>
      ),
    },
    {
      key: "city",
      header: "Localização",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {[row.city, row.state].filter(Boolean).join(", ") || "—"}
        </div>
      ),
    },
    {
      key: "launch_status",
      header: "Status",
      render: (row) => {
        const st = statusVariant[row.launch_status ?? ""];
        return st ? <StatusChip variant={st.variant} label={st.label} /> : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: "total_units",
      header: "Unidades",
      render: (row) => {
        const bc = blockCounts[row.id] ?? 0;
        const uc = unitCountsByDev[row.id] ?? 0;
        return (
          <div className="text-sm">
            <span className="font-medium text-foreground">{uc}</span>
            <span className="text-muted-foreground text-[11px] ml-1">({bc} blocos)</span>
            {bc === 0 && (
              <p className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-0.5">
                <AlertCircle className="h-2.5 w-2.5" /> Sem blocos
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "readiness",
      header: "Status Config.",
      render: (row) => {
        const bc = blockCounts[row.id] ?? 0;
        const uc = unitCountsByDev[row.id] ?? 0;
        if (bc > 0 && uc > 0) return <StatusChip variant="success" label="Pronto" />;
        if (bc > 0) return <StatusChip variant="warning" label="Sem unidades" />;
        return <StatusChip variant="neutral" label="Pendente" />;
      },
    },
    {
      key: "delivery_forecast_at",
      header: "Previsão",
      render: (row) =>
        row.delivery_forecast_at ? (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(row.delivery_forecast_at), "MMM yyyy", { locale: ptBR })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[240px]",
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          {canWrite && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
              <Pencil className="h-3 w-3" /> Editar
            </Button>
          )}
          <Link to={`/interno/cadastros/blocos?dev=${row.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Layers className="h-3 w-3" /> Blocos
            </Button>
          </Link>
          <Link to={`/interno/cadastros/unidades?dev=${row.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Home className="h-3 w-3" /> Unidades
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // ── Render ──
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Empreendimentos" breadcrumb={["Interno", "Cadastros", "Empreendimentos"]} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 h-24 animate-pulse" />
          ))}
        </div>
        <div className="glass-card h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Empreendimentos"
        description="Gestão de empreendimentos da carteira imobiliária."
        breadcrumb={["Interno", "Cadastros", "Empreendimentos"]}
        actions={
          canWrite ? (
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Novo Empreendimento
            </Button>
          ) : undefined
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} />
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <SearchBar placeholder="Buscar empreendimento..." value={search} onChange={setSearch} className="max-w-md" />

        <div className="flex flex-wrap gap-4">
          {isPlatformAdmin && organizations.length > 1 && (
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Organização</span>
              <ChipFilter
                options={organizations.map((o) => ({ label: o.name, value: o.id }))}
                selected={orgFilter}
                onChange={setOrgFilter}
              />
            </div>
          )}
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Status</span>
            <ChipFilter options={STATUS_OPTIONS} selected={statusFilter} onChange={setStatusFilter} />
          </div>
          {states.length > 1 && (
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Estado</span>
              <ChipFilter options={states.map((s) => ({ label: s, value: s }))} selected={stateFilter} onChange={setStateFilter} />
            </div>
          )}
          {cities.length > 1 && (
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Cidade</span>
              <ChipFilter options={cities.map((c) => ({ label: c, value: c }))} selected={cityFilter} onChange={setCityFilter} />
            </div>
          )}
        </div>
      </div>

      {/* Table or Empty */}
      {developments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum empreendimento cadastrado"
          description="Cadastre o primeiro empreendimento para começar a estruturar blocos, unidades e contratos."
          action={
            canWrite ? (
              <Button size="sm" className="gap-1.5" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Criar Empreendimento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          compact
          emptyMessage="Nenhum empreendimento encontrado com os filtros aplicados."
        />
      )}

      {/* Drawer Form */}
      <DrawerShell
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Editar Empreendimento" : "Novo Empreendimento"}
      >
        <div className="space-y-4">
          {/* Organization */}
          <div>
            <Label className="text-xs font-medium">Organização *</Label>
            <Select value={form.organization_id} onValueChange={(v) => updateField("organization_id", v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.organization_id && <p className="text-[11px] text-destructive mt-1">{formErrors.organization_id}</p>}
          </div>

          {/* Name */}
          <div>
            <Label className="text-xs font-medium">Nome *</Label>
            <Input
              className="mt-1"
              value={form.name}
              onChange={(e) => {
                updateField("name", e.target.value);
                if (!editing) updateField("slug", autoSlug(e.target.value));
              }}
              placeholder="Residencial Jardim das Flores"
              maxLength={100}
            />
            {formErrors.name && <p className="text-[11px] text-destructive mt-1">{formErrors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <Label className="text-xs font-medium">Slug *</Label>
            <Input
              className="mt-1"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="residencial-jardim-das-flores"
              maxLength={100}
            />
            {formErrors.slug && <p className="text-[11px] text-destructive mt-1">{formErrors.slug}</p>}
            <p className="text-[10px] text-muted-foreground mt-0.5">Identificador único na URL. Use letras minúsculas, números e hífens.</p>
          </div>

          {/* Address */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs font-medium">Endereço</Label>
              <Input className="mt-1" value={form.address_line} onChange={(e) => updateField("address_line", e.target.value)} placeholder="Rua das Palmeiras, 100" maxLength={200} />
            </div>
            <div>
              <Label className="text-xs font-medium">Bairro</Label>
              <Input className="mt-1" value={form.neighborhood} onChange={(e) => updateField("neighborhood", e.target.value)} placeholder="Centro" maxLength={100} />
            </div>
            <div>
              <Label className="text-xs font-medium">CEP</Label>
              <Input className="mt-1" value={form.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} placeholder="01001-000" maxLength={9} />
              {formErrors.zip_code && <p className="text-[11px] text-destructive mt-1">{formErrors.zip_code}</p>}
            </div>
            <div>
              <Label className="text-xs font-medium">Cidade</Label>
              <Input className="mt-1" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="São Paulo" maxLength={100} />
            </div>
            <div>
              <Label className="text-xs font-medium">Estado</Label>
              <Select value={form.state} onValueChange={(v) => updateField("state", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {STATES_BR.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status & Units */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Status</Label>
              <Select value={form.launch_status} onValueChange={(v) => updateField("launch_status", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_launch">Pré-lançamento</SelectItem>
                  <SelectItem value="launch">Lançamento</SelectItem>
                  <SelectItem value="construction">Em obra</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Total de Unidades</Label>
              <Input className="mt-1" type="number" min="0" value={form.total_units} onChange={(e) => updateField("total_units", e.target.value)} placeholder="120" />
              {formErrors.total_units && <p className="text-[11px] text-destructive mt-1">{formErrors.total_units}</p>}
            </div>
          </div>

          {/* Delivery Forecast */}
          <div>
            <Label className="text-xs font-medium">Previsão de Entrega</Label>
            <Input className="mt-1" type="date" value={form.delivery_forecast_at} onChange={(e) => updateField("delivery_forecast_at", e.target.value)} />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closeDrawer}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : editing ? "Salvar Alterações" : "Criar Empreendimento"}
            </Button>
          </div>
        </div>
      </DrawerShell>
    </div>
  );
}
