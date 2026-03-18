import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusChip } from "@/components/ui/status-chip";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, DataColumn } from "@/components/ui/data-table";
import { FolderOpen, Loader2, Plus, Pencil, Eye, EyeOff, Layers, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const SCOPES = [
  { value: "geral", label: "Geral" },
  { value: "contrato", label: "Contrato" },
  { value: "financeiro", label: "Financeiro" },
  { value: "unidade", label: "Unidade" },
  { value: "vistoria", label: "Vistoria" },
  { value: "assistencia", label: "Assistência" },
  { value: "garantia", label: "Garantia" },
];

const emptyForm = {
  name: "",
  description: "",
  scope: "geral",
  visible_to_customer: true,
  active: true,
  sort_order: "0",
};

export default function InternoCategoriasDocumentos() {
  const { user, isPlatformAdmin, memberships } = useAuth();
  const canWrite = isPlatformAdmin || memberships.some(m => m.active && ["org_admin", "document_agent"].includes(m.role));
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["document-categories-mgmt"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("*")
        .order("sort_order, name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (categories ?? []).filter((c: any) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterScope !== "all" && c.scope !== filterScope) return false;
    if (filterActive === "active" && !c.active) return false;
    if (filterActive === "inactive" && c.active) return false;
    return true;
  });

  const totalCount = categories?.length ?? 0;
  const activeCount = categories?.filter((c: any) => c.active).length ?? 0;
  const visibleCount = categories?.filter((c: any) => c.visible_to_customer).length ?? 0;
  const scopeCount = new Set(categories?.map((c: any) => c.scope) ?? []).size;

  const resetForm = () => { setForm(emptyForm); setEditId(null); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: memberships } = await supabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", user!.id)
        .eq("active", true)
        .limit(1);
      const orgId = memberships?.[0]?.organization_id;
      if (!orgId) throw new Error("Organização não encontrada");

      const payload = {
        name: form.name,
        description: form.description || null,
        scope: form.scope,
        visible_to_customer: form.visible_to_customer,
        active: form.active,
        sort_order: parseInt(form.sort_order) || 0,
      };

      if (editId) {
        const { error } = await supabase.from("document_categories").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("document_categories").insert({ ...payload, organization_id: orgId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Categoria atualizada!" : "Categoria criada!");
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["document-categories-mgmt"] });
    },
    onError: () => toast.error("Erro ao salvar categoria."),
  });

  const startEdit = (cat: any) => {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      scope: cat.scope,
      visible_to_customer: cat.visible_to_customer,
      active: cat.active,
      sort_order: String(cat.sort_order),
    });
    setShowForm(true);
  };

  const columns: DataColumn<any>[] = [
    {
      key: "name",
      header: "Nome",
      render: (row) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Escopo",
      render: (row) => (
        <StatusChip label={SCOPES.find(s => s.value === row.scope)?.label ?? row.scope} variant="neutral" size="sm" />
      ),
    },
    {
      key: "visible_to_customer",
      header: "Visibilidade",
      render: (row) => row.visible_to_customer
        ? <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />,
    },
    {
      key: "active",
      header: "Status",
      render: (row) => <StatusChip label={row.active ? "Ativa" : "Inativa"} variant={row.active ? "success" : "neutral"} size="sm" />,
    },
    ...(canWrite ? [{
      key: "actions",
      header: "",
      render: (row: any) => (
        <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
      className: "w-10",
    }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Categorias de Documentos"
        description="Organize o acervo documental com categorias normalizadas."
        breadcrumb={["Interno", "Cadastros", "Categorias de Documentos"]}
        actions={canWrite ? (
          <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Categoria</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar Categoria" : "Nova Categoria de Documento"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={100} placeholder="Ex: Manual do Proprietário" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} maxLength={300} placeholder="Breve descrição da categoria" />
                </div>
                <div>
                  <Label>Escopo *</Label>
                  <Select value={form.scope} onValueChange={(v) => setForm((f) => ({ ...f, scope: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCOPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ordem de Exibição</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} min={0} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Visível ao Cliente</Label>
                  <Switch checked={form.visible_to_customer} onCheckedChange={(v) => setForm((f) => ({ ...f, visible_to_customer: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativa</Label>
                  <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
                </div>
                <Button className="w-full" disabled={!form.name || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editId ? "Salvar Alterações" : "Criar Categoria"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : undefined}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total" value={totalCount} icon={FolderOpen} />
        <KpiCard title="Ativas" value={activeCount} icon={CheckCircle2} />
        <KpiCard title="Escopos" value={scopeCount} icon={Layers} />
        <KpiCard title="Visíveis ao Cliente" value={visibleCount} icon={Eye} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchBar placeholder="Buscar categoria..." value={search} onChange={setSearch} className="max-w-sm" />
        <Select value={filterScope} onValueChange={setFilterScope}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos escopos</SelectItem>
            {SCOPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Nenhuma categoria de documento" description="Crie categorias para organizar o acervo documental da plataforma." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          emptyMessage="Nenhuma categoria encontrada."
        />
      )}
    </div>
  );
}
