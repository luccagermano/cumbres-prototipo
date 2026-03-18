import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, DataColumn } from "@/components/ui/data-table";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter } from "@/components/ui/chip-filter";
import { EmptyState } from "@/components/EmptyState";
import { DrawerShell } from "@/components/ui/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Layers, Plus, Pencil, Home, Building2, Hash, AlertCircle,
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Block = Tables<"blocks">;
type Development = Tables<"developments">;

type BlockWithCounts = Block & { unit_count: number; dev_name: string; org_name: string };

type FormData = {
  development_id: string;
  name: string;
  sort_order: string;
};

const emptyForm: FormData = { development_id: "", name: "", sort_order: "0" };

export default function InternoBlocos() {
  const { user, isPlatformAdmin, memberships } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const prefilledDevId = searchParams.get("dev") ?? "";

  const [search, setSearch] = useState("");
  const [devFilter, setDevFilter] = useState<string[]>(prefilledDevId ? [prefilledDevId] : []);
  const [orgFilter, setOrgFilter] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Block | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const canWrite = isPlatformAdmin || memberships.some((m) => m.role === "org_admin" && m.active);

  // ── Queries ──
  const { data: blocks = [], isLoading: loadBlocks } = useQuery({
    queryKey: ["interno-blocos"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("blocks").select("*").order("name");
      if (error) throw error;
      return data as Block[];
    },
  });

  const { data: developments = [] } = useQuery({
    queryKey: ["interno-developments-lookup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("developments").select("id, name, organization_id").order("name");
      return (data ?? []) as Pick<Development, "id" | "name" | "organization_id">[];
    },
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["interno-orgs-lookup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data: unitCounts = {} } = useQuery({
    queryKey: ["interno-blocos-unit-counts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("units").select("block_id");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((u) => {
        counts[u.block_id] = (counts[u.block_id] || 0) + 1;
      });
      return counts;
    },
  });

  // ── Lookups ──
  const devMap = useMemo(() => {
    const m = new Map<string, { name: string; org_id: string }>();
    developments.forEach((d) => m.set(d.id, { name: d.name, org_id: d.organization_id }));
    return m;
  }, [developments]);

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    organizations.forEach((o) => m.set(o.id, o.name));
    return m;
  }, [organizations]);

  // ── Enriched data ──
  const enriched: BlockWithCounts[] = useMemo(
    () =>
      blocks.map((b) => {
        const dev = devMap.get(b.development_id);
        return {
          ...b,
          unit_count: unitCounts[b.id] ?? 0,
          dev_name: dev?.name ?? "—",
          org_name: dev ? orgMap.get(dev.org_id) ?? "—" : "—",
        };
      }),
    [blocks, devMap, orgMap, unitCounts]
  );

  // ── Filters ──
  const filtered = useMemo(() => {
    let result = enriched;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.name.toLowerCase().includes(q) || b.dev_name.toLowerCase().includes(q));
    }
    if (devFilter.length > 0) result = result.filter((b) => devFilter.includes(b.development_id));
    if (orgFilter.length > 0) {
      const orgDevIds = new Set(developments.filter((d) => orgFilter.includes(d.organization_id)).map((d) => d.id));
      result = result.filter((b) => orgDevIds.has(b.development_id));
    }
    return result;
  }, [enriched, search, devFilter, orgFilter, developments]);

  // ── KPIs ──
  const devsWithBlocks = new Set(blocks.map((b) => b.development_id)).size;
  const blocksWithoutUnits = enriched.filter((b) => b.unit_count === 0).length;

  const kpis = [
    { title: "Total de Blocos", value: blocks.length, icon: Layers },
    { title: "Empreend. com Blocos", value: devsWithBlocks, icon: Building2 },
    { title: "Blocos sem Unidades", value: blocksWithoutUnits, icon: Home },
  ];

  // ── Mutation ──
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        development_id: data.development_id,
        name: data.name.trim(),
        sort_order: parseInt(data.sort_order, 10) || 0,
      };
      if (editing) {
        const { error } = await supabase.from("blocks").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blocks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Bloco atualizado com sucesso." : "Bloco criado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["interno-blocos"] });
      queryClient.invalidateQueries({ queryKey: ["interno-blocos-unit-counts"] });
      queryClient.invalidateQueries({ queryKey: ["cadastros-blocks"] });
      closeDrawer();
    },
    onError: () => {
      toast.error("Erro ao salvar bloco.");
    },
  });

  // ── Drawer ──
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, development_id: prefilledDevId || (devFilter.length === 1 ? devFilter[0] : "") });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (block: Block) => {
    setEditing(block);
    setForm({ development_id: block.development_id, name: block.name, sort_order: block.sort_order.toString() });
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
    if (!form.development_id) errors.development_id = "Selecione um empreendimento.";
    if (!form.name.trim()) errors.name = "Nome é obrigatório.";
    if (form.sort_order && isNaN(Number(form.sort_order))) errors.sort_order = "Informe um número válido.";
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

  // ── Columns ──
  const columns: DataColumn<BlockWithCounts>[] = [
    {
      key: "name",
      header: "Bloco / Torre",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Layers className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
            <p className="text-[11px] text-muted-foreground">{row.org_name} › {row.dev_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "development_id",
      header: "Empreendimento",
      render: (row) => <span className="text-sm text-foreground">{row.dev_name}</span>,
    },
    {
      key: "unit_count",
      header: "Unidades",
      render: (row) => (
        <div>
          <span className={`text-sm font-medium ${row.unit_count === 0 ? "text-amber-600" : "text-foreground"}`}>
            {row.unit_count}
          </span>
          {row.unit_count === 0 && (
            <p className="text-[10px] text-amber-600 flex items-center gap-0.5">
              <AlertCircle className="h-2.5 w-2.5" /> Pendente
            </p>
          )}
        </div>
      ),
    },
    {
      key: "sort_order",
      header: "Ordem",
      render: (row) => (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Hash className="h-3 w-3" />
          {row.sort_order}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[260px]",
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          {canWrite && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
              <Pencil className="h-3 w-3" /> Editar
            </Button>
          )}
          <Link to={`/interno/cadastros/unidades?block=${row.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Home className="h-3 w-3" /> Unidades
            </Button>
          </Link>
          {canWrite && (
            <Link to={`/interno/cadastros/unidades?block=${row.id}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Criar Unidade
              </Button>
            </Link>
          )}
        </div>
      ),
    },
  ];

  // ── Render ──
  if (loadBlocks) {
    return (
      <div>
        <PageHeader title="Blocos / Torres" breadcrumb={["Interno", "Cadastros", "Blocos"]} />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => <div key={i} className="glass-card p-5 h-24 animate-pulse" />)}
        </div>
        <div className="glass-card h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Blocos / Torres"
        description="Gestão de blocos e torres vinculados aos empreendimentos."
        breadcrumb={["Interno", "Cadastros", "Blocos"]}
        actions={
          canWrite ? (
            <Button size="sm" className="gap-1.5" onClick={openCreate} disabled={developments.length === 0}>
              <Plus className="h-4 w-4" /> Novo Bloco
            </Button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} />
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <SearchBar placeholder="Buscar bloco..." value={search} onChange={setSearch} className="max-w-md" />
        <div className="flex flex-wrap gap-4">
          {isPlatformAdmin && organizations.length > 1 && (
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Organização</span>
              <ChipFilter options={organizations.map((o) => ({ label: o.name, value: o.id }))} selected={orgFilter} onChange={setOrgFilter} />
            </div>
          )}
          {developments.length > 1 && (
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Empreendimento</span>
              <ChipFilter options={developments.map((d) => ({ label: d.name, value: d.id }))} selected={devFilter} onChange={setDevFilter} />
            </div>
          )}
        </div>
      </div>

      {/* Table or Empty */}
      {blocks.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nenhum bloco cadastrado"
          description="Cadastre o primeiro bloco ou torre para organizar as unidades dos empreendimentos."
          action={
            canWrite && developments.length > 0 ? (
              <Button size="sm" className="gap-1.5" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Criar Bloco
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} keyExtractor={(row) => row.id} compact emptyMessage="Nenhum bloco encontrado com os filtros aplicados." />
      )}

      {/* Drawer */}
      <DrawerShell open={drawerOpen} onClose={closeDrawer} title={editing ? "Editar Bloco" : "Novo Bloco"}>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Empreendimento *</Label>
            <Select value={form.development_id} onValueChange={(v) => updateField("development_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {developments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                    <span className="text-muted-foreground ml-1 text-xs">({orgMap.get(d.organization_id) ?? ""})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.development_id && <p className="text-[11px] text-destructive mt-1">{formErrors.development_id}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium">Nome *</Label>
            <Input className="mt-1" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Torre A" maxLength={100} />
            {formErrors.name && <p className="text-[11px] text-destructive mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium">Ordem de exibição</Label>
            <Input className="mt-1" type="number" min="0" value={form.sort_order} onChange={(e) => updateField("sort_order", e.target.value)} placeholder="0" />
            {formErrors.sort_order && <p className="text-[11px] text-destructive mt-1">{formErrors.sort_order}</p>}
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closeDrawer}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : editing ? "Salvar Alterações" : "Criar Bloco"}
            </Button>
          </div>
        </div>
      </DrawerShell>
    </div>
  );
}
