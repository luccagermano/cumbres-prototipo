import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Home,
  Plus,
  Pencil,
  Layers,
  Building2,
  Users,
  FileSignature,
  CheckCircle2,
  ShoppingCart,
  Tag,
  Ruler,
  AlertCircle,
  Link2,
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<"units">;

type UnitEnriched = Unit & {
  block_name: string;
  dev_name: string;
  dev_id: string;
  org_name: string;
  customer_count: number;
  contract_count: number;
};

const COMMERCIAL_STATUSES: ChipFilterOption[] = [
  { label: "Disponível", value: "available" },
  { label: "Reservada", value: "reserved" },
  { label: "Vendida", value: "sold" },
  { label: "Entregue", value: "handed_over" },
];

const statusVariant: Record<
  string,
  { variant: "success" | "warning" | "info" | "neutral" | "pending"; label: string }
> = {
  available: { variant: "success", label: "Disponível" },
  reserved: { variant: "warning", label: "Reservada" },
  sold: { variant: "info", label: "Vendida" },
  handed_over: { variant: "neutral", label: "Entregue" },
};

type FormData = {
  block_id: string;
  code: string;
  floor_label: string;
  typology: string;
  private_area_m2: string;
  bedrooms: string;
  bathrooms: string;
  parking_spots: string;
  commercial_status: string;
  handed_over_at: string;
};

const emptyForm: FormData = {
  block_id: "",
  code: "",
  floor_label: "",
  typology: "",
  private_area_m2: "",
  bedrooms: "",
  bathrooms: "",
  parking_spots: "",
  commercial_status: "available",
  handed_over_at: "",
};

export default function InternoUnidades() {
  const { user, isPlatformAdmin, memberships } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const prefilledBlockId = searchParams.get("block") ?? "";
  const prefilledDevId = searchParams.get("dev") ?? "";

  const [search, setSearch] = useState("");
  const [devFilter, setDevFilter] = useState<string[]>(
    prefilledDevId ? [prefilledDevId] : []
  );
  const [blockFilter, setBlockFilter] = useState<string[]>(
    prefilledBlockId ? [prefilledBlockId] : []
  );
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typologyFilter, setTypologyFilter] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});

  const canWrite =
    isPlatformAdmin ||
    memberships.some((m) => m.role === "org_admin" && m.active);

  // ── Queries ──────────────────────────────────────────
  const { data: units = [], isLoading } = useQuery({
    queryKey: ["interno-unidades"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("code");
      if (error) throw error;
      return data as Unit[];
    },
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["interno-blocks-lookup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("blocks")
        .select("id, name, development_id, sort_order")
        .order("name");
      return (data ?? []) as {
        id: string;
        name: string;
        development_id: string;
        sort_order: number;
      }[];
    },
  });

  const { data: developments = [] } = useQuery({
    queryKey: ["interno-devs-lookup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("developments")
        .select("id, name, organization_id")
        .order("name");
      return (data ?? []) as {
        id: string;
        name: string;
        organization_id: string;
      }[];
    },
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["interno-orgs-lookup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data: customerCounts = {} } = useQuery({
    queryKey: ["interno-unit-customer-counts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("unit_memberships")
        .select("unit_id")
        .eq("active", true);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((u) => {
        counts[u.unit_id] = (counts[u.unit_id] || 0) + 1;
      });
      return counts;
    },
  });

  const { data: contractCounts = {} } = useQuery({
    queryKey: ["interno-unit-contract-counts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_contracts")
        .select("unit_id");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((c) => {
        counts[c.unit_id] = (counts[c.unit_id] || 0) + 1;
      });
      return counts;
    },
  });

  // ── Lookups ──
  const blockMap = useMemo(() => {
    const m = new Map<string, { name: string; dev_id: string }>();
    blocks.forEach((b) => m.set(b.id, { name: b.name, dev_id: b.development_id }));
    return m;
  }, [blocks]);

  const devMap = useMemo(() => {
    const m = new Map<string, { name: string; org_id: string }>();
    developments.forEach((d) =>
      m.set(d.id, { name: d.name, org_id: d.organization_id })
    );
    return m;
  }, [developments]);

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    organizations.forEach((o) => m.set(o.id, o.name));
    return m;
  }, [organizations]);

  // ── Enriched data ──
  const enriched: UnitEnriched[] = useMemo(() => {
    return units.map((u) => {
      const block = blockMap.get(u.block_id);
      const dev = block ? devMap.get(block.dev_id) : undefined;
      return {
        ...u,
        block_name: block?.name ?? "—",
        dev_name: dev?.name ?? "—",
        dev_id: block?.dev_id ?? "",
        org_name: dev ? orgMap.get(dev.org_id) ?? "—" : "—",
        customer_count: customerCounts[u.id] ?? 0,
        contract_count: contractCounts[u.id] ?? 0,
      };
    });
  }, [units, blockMap, devMap, orgMap, customerCounts, contractCounts]);

  // ── Typologies ──
  const typologies = useMemo(
    () =>
      [
        ...new Set(
          units
            .map((u) => u.typology)
            .filter(Boolean) as string[]
        ),
      ].sort(),
    [units]
  );

  // ── Filtered blocks by selected dev ──
  const filteredBlockOptions = useMemo(() => {
    if (devFilter.length === 0) return blocks;
    return blocks.filter((b) => devFilter.includes(b.development_id));
  }, [blocks, devFilter]);

  // ── Filters ──
  const filtered = useMemo(() => {
    let result = enriched;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.code.toLowerCase().includes(q) ||
          u.block_name.toLowerCase().includes(q) ||
          u.dev_name.toLowerCase().includes(q) ||
          u.typology?.toLowerCase().includes(q)
      );
    }
    if (devFilter.length > 0)
      result = result.filter((u) => devFilter.includes(u.dev_id));
    if (blockFilter.length > 0)
      result = result.filter((u) => blockFilter.includes(u.block_id));
    if (statusFilter.length > 0)
      result = result.filter(
        (u) => u.commercial_status && statusFilter.includes(u.commercial_status)
      );
    if (typologyFilter.length > 0)
      result = result.filter(
        (u) => u.typology && typologyFilter.includes(u.typology)
      );
    return result;
  }, [enriched, search, devFilter, blockFilter, statusFilter, typologyFilter]);

  // ── KPIs ──
  const kpis = [
    { title: "Total", value: units.length, icon: Home },
    {
      title: "Disponíveis",
      value: units.filter((u) => u.commercial_status === "available").length,
      icon: Tag,
    },
    {
      title: "Reservadas",
      value: units.filter((u) => u.commercial_status === "reserved").length,
      icon: ShoppingCart,
    },
    {
      title: "Vendidas",
      value: units.filter((u) => u.commercial_status === "sold").length,
      icon: FileSignature,
    },
    {
      title: "Entregues",
      value: units.filter((u) => u.commercial_status === "handed_over").length,
      icon: CheckCircle2,
    },
  ];

  // ── Drawer ──
  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      block_id:
        prefilledBlockId ||
        (blockFilter.length === 1 ? blockFilter[0] : ""),
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (unit: Unit) => {
    setEditing(unit);
    setForm({
      block_id: unit.block_id,
      code: unit.code,
      floor_label: unit.floor_label ?? "",
      typology: unit.typology ?? "",
      private_area_m2: unit.private_area_m2?.toString() ?? "",
      bedrooms: unit.bedrooms?.toString() ?? "",
      bathrooms: unit.bathrooms?.toString() ?? "",
      parking_spots: unit.parking_spots?.toString() ?? "",
      commercial_status: unit.commercial_status ?? "available",
      handed_over_at: unit.handed_over_at
        ? unit.handed_over_at.split("T")[0]
        : "",
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
    if (!form.block_id) errors.block_id = "Selecione um bloco.";
    if (!form.code.trim()) errors.code = "Código é obrigatório.";
    if (
      form.private_area_m2 &&
      (isNaN(Number(form.private_area_m2)) || Number(form.private_area_m2) < 0)
    )
      errors.private_area_m2 = "Informe um número válido.";
    if (form.bedrooms && (isNaN(Number(form.bedrooms)) || Number(form.bedrooms) < 0))
      errors.bedrooms = "Informe um número válido.";
    if (form.bathrooms && (isNaN(Number(form.bathrooms)) || Number(form.bathrooms) < 0))
      errors.bathrooms = "Informe um número válido.";
    if (
      form.parking_spots &&
      (isNaN(Number(form.parking_spots)) || Number(form.parking_spots) < 0)
    )
      errors.parking_spots = "Informe um número válido.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        block_id: data.block_id,
        code: data.code.trim(),
        floor_label: data.floor_label.trim() || null,
        typology: data.typology.trim() || null,
        private_area_m2: data.private_area_m2
          ? parseFloat(data.private_area_m2)
          : null,
        bedrooms: data.bedrooms ? parseInt(data.bedrooms, 10) : null,
        bathrooms: data.bathrooms ? parseInt(data.bathrooms, 10) : null,
        parking_spots: data.parking_spots
          ? parseInt(data.parking_spots, 10)
          : null,
        commercial_status: data.commercial_status || null,
        handed_over_at: data.handed_over_at || null,
      };
      if (editing) {
        const { error } = await supabase
          .from("units")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("units").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        editing
          ? "Unidade atualizada com sucesso."
          : "Unidade criada com sucesso."
      );
      queryClient.invalidateQueries({ queryKey: ["interno-unidades"] });
      queryClient.invalidateQueries({ queryKey: ["interno-unit-customer-counts"] });
      queryClient.invalidateQueries({ queryKey: ["interno-unit-contract-counts"] });
      queryClient.invalidateQueries({ queryKey: ["cadastros-units"] });
      closeDrawer();
    },
    onError: (err: Error) => {
      if (
        err.message?.includes("duplicate") ||
        err.message?.includes("unique")
      ) {
        toast.error("Já existe uma unidade com esse código neste bloco.");
      } else {
        toast.error("Erro ao salvar unidade.");
      }
    },
  });

  const handleSubmit = () => {
    if (!validate()) return;
    saveMutation.mutate(form);
  };

  const updateField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key])
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ── Form block options filtered by selected dev in drawer ──
  const formDevId = form.block_id
    ? blockMap.get(form.block_id)?.dev_id
    : undefined;

  const drawerBlockOptions = useMemo(() => {
    // Show all blocks, grouped labels will indicate context
    return blocks;
  }, [blocks]);

  // ── Columns ──
  const columns: DataColumn<UnitEnriched>[] = [
    {
      key: "code",
      header: "Unidade",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Home className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{row.code}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {row.dev_name} › {row.block_name}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "typology",
      header: "Tipologia",
      render: (row) => (
        <span className="text-sm text-foreground">
          {row.typology ?? "—"}
        </span>
      ),
    },
    {
      key: "private_area_m2",
      header: "Área",
      render: (row) =>
        row.private_area_m2 ? (
          <span className="text-sm text-foreground flex items-center gap-1">
            <Ruler className="h-3 w-3 text-muted-foreground" />
            {row.private_area_m2.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            m²
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "specs",
      header: "Especificações",
      render: (row) => {
        const specs: string[] = [];
        if (row.bedrooms) specs.push(`${row.bedrooms} qto${row.bedrooms > 1 ? "s" : ""}`);
        if (row.bathrooms) specs.push(`${row.bathrooms} bnh${row.bathrooms > 1 ? "s" : ""}`);
        if (row.parking_spots) specs.push(`${row.parking_spots} vaga${row.parking_spots > 1 ? "s" : ""}`);
        return (
          <span className="text-xs text-muted-foreground">
            {specs.length > 0 ? specs.join(" · ") : "—"}
          </span>
        );
      },
    },
    {
      key: "commercial_status",
      header: "Status",
      render: (row) => {
        const st = statusVariant[row.commercial_status ?? ""];
        return st ? (
          <StatusChip variant={st.variant} label={st.label} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "relations",
      header: "Vínculos",
      render: (row) => (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" title="Clientes vinculados">
            <Users className="h-3 w-3" /> {row.customer_count}
          </span>
          <span className="flex items-center gap-1" title="Contratos">
            <FileSignature className="h-3 w-3" /> {row.contract_count}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[100px]",
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          {canWrite && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
            >
              <Pencil className="h-3 w-3" /> Editar
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ──
  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Unidades"
          breadcrumb={["Interno", "Cadastros", "Unidades"]}
        />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
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
        title="Unidades"
        description="Gestão de unidades residenciais e comerciais."
        breadcrumb={["Interno", "Cadastros", "Unidades"]}
        actions={
          canWrite ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={openCreate}
              disabled={blocks.length === 0}
            >
              <Plus className="h-4 w-4" /> Nova Unidade
            </Button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <SearchBar
          placeholder="Buscar unidade por código, bloco ou empreendimento..."
          value={search}
          onChange={setSearch}
          className="max-w-lg"
        />
        <div className="flex flex-wrap gap-4">
          {developments.length > 1 && (
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                Empreendimento
              </span>
              <ChipFilter
                options={developments.map((d) => ({
                  label: d.name,
                  value: d.id,
                }))}
                selected={devFilter}
                onChange={setDevFilter}
              />
            </div>
          )}
          {filteredBlockOptions.length > 1 && (
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                Bloco
              </span>
              <ChipFilter
                options={filteredBlockOptions.map((b) => ({
                  label: b.name,
                  value: b.id,
                }))}
                selected={blockFilter}
                onChange={setBlockFilter}
              />
            </div>
          )}
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
              Status
            </span>
            <ChipFilter
              options={COMMERCIAL_STATUSES}
              selected={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          {typologies.length > 1 && (
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                Tipologia
              </span>
              <ChipFilter
                options={typologies.map((t) => ({ label: t, value: t }))}
                selected={typologyFilter}
                onChange={setTypologyFilter}
              />
            </div>
          )}
        </div>
      </div>

      {/* Table or Empty */}
      {units.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Nenhuma unidade cadastrada"
          description="Cadastre blocos primeiro e depois adicione as unidades de cada empreendimento."
          action={
            canWrite && blocks.length > 0 ? (
              <Button size="sm" className="gap-1.5" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Criar Unidade
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
          emptyMessage="Nenhuma unidade encontrada com os filtros aplicados."
        />
      )}

      {/* Drawer */}
      <DrawerShell
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Editar Unidade" : "Nova Unidade"}
      >
        <div className="space-y-4">
          {/* Block selection */}
          <div>
            <Label className="text-xs font-medium">Bloco / Torre *</Label>
            <Select
              value={form.block_id}
              onValueChange={(v) => updateField("block_id", v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {drawerBlockOptions.map((b) => {
                  const dev = devMap.get(b.development_id);
                  return (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({dev?.name ?? ""})
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {formErrors.block_id && (
              <p className="text-[11px] text-destructive mt-1">
                {formErrors.block_id}
              </p>
            )}
          </div>

          {/* Code & Floor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Código *</Label>
              <Input
                className="mt-1"
                value={form.code}
                onChange={(e) => updateField("code", e.target.value)}
                placeholder="101"
                maxLength={20}
              />
              {formErrors.code && (
                <p className="text-[11px] text-destructive mt-1">
                  {formErrors.code}
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs font-medium">Andar</Label>
              <Input
                className="mt-1"
                value={form.floor_label}
                onChange={(e) => updateField("floor_label", e.target.value)}
                placeholder="1º andar"
                maxLength={20}
              />
            </div>
          </div>

          {/* Typology & Area */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Tipologia</Label>
              <Input
                className="mt-1"
                value={form.typology}
                onChange={(e) => updateField("typology", e.target.value)}
                placeholder="2 quartos"
                maxLength={50}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Área privativa (m²)</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                step="0.01"
                value={form.private_area_m2}
                onChange={(e) => updateField("private_area_m2", e.target.value)}
                placeholder="65.00"
              />
              {formErrors.private_area_m2 && (
                <p className="text-[11px] text-destructive mt-1">
                  {formErrors.private_area_m2}
                </p>
              )}
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-medium">Quartos</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={(e) => updateField("bedrooms", e.target.value)}
                placeholder="2"
              />
              {formErrors.bedrooms && (
                <p className="text-[11px] text-destructive mt-1">
                  {formErrors.bedrooms}
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs font-medium">Banheiros</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                value={form.bathrooms}
                onChange={(e) => updateField("bathrooms", e.target.value)}
                placeholder="1"
              />
              {formErrors.bathrooms && (
                <p className="text-[11px] text-destructive mt-1">
                  {formErrors.bathrooms}
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs font-medium">Vagas</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                value={form.parking_spots}
                onChange={(e) => updateField("parking_spots", e.target.value)}
                placeholder="1"
              />
              {formErrors.parking_spots && (
                <p className="text-[11px] text-destructive mt-1">
                  {formErrors.parking_spots}
                </p>
              )}
            </div>
          </div>

          {/* Status & Handover */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Status Comercial</Label>
              <Select
                value={form.commercial_status}
                onValueChange={(v) => updateField("commercial_status", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="reserved">Reservada</SelectItem>
                  <SelectItem value="sold">Vendida</SelectItem>
                  <SelectItem value="handed_over">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Data de Entrega</Label>
              <Input
                className="mt-1"
                type="date"
                value={form.handed_over_at}
                onChange={(e) => updateField("handed_over_at", e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closeDrawer}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? "Salvando..."
                : editing
                ? "Salvar Alterações"
                : "Criar Unidade"}
            </Button>
          </div>
        </div>
      </DrawerShell>
    </div>
  );
}
