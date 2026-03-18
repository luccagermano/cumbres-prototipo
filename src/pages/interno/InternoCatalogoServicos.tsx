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
import { Wrench, Loader2, Plus, Pencil, Eye, EyeOff, CheckCircle2, Tag, Clock } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const emptyForm = {
  name: "",
  description: "",
  price_label: "",
  service_code: "",
  category_name: "",
  estimated_delivery_days: "",
  visible_to_customer: true,
  active: true,
  sort_order: "0",
};

export default function InternoCatalogoServicos() {
  const { user, isPlatformAdmin, memberships } = useAuth();
  const canWrite = isPlatformAdmin || memberships.some(m => m.active && m.role === "org_admin");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: services, isLoading } = useQuery({
    queryKey: ["service-catalog-mgmt"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("*")
        .order("sort_order, name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (services ?? []).filter((s: any) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterActive === "active" && !s.active) return false;
    if (filterActive === "inactive" && s.active) return false;
    return true;
  });

  const totalCount = services?.length ?? 0;
  const activeCount = services?.filter((s: any) => s.active).length ?? 0;
  const visibleCount = services?.filter((s: any) => s.visible_to_customer).length ?? 0;
  const categoriesSet = new Set((services ?? []).map((s: any) => s.category_name).filter(Boolean));

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
        price_label: form.price_label || null,
        service_code: form.service_code || null,
        category_name: form.category_name || null,
        estimated_delivery_days: form.estimated_delivery_days ? parseInt(form.estimated_delivery_days) : null,
        visible_to_customer: form.visible_to_customer,
        active: form.active,
        sort_order: parseInt(form.sort_order) || 0,
      };

      if (editId) {
        const { error } = await supabase.from("service_catalog").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_catalog").insert({ ...payload, organization_id: orgId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Serviço atualizado!" : "Serviço criado!");
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["service-catalog-mgmt"] });
    },
    onError: () => toast.error("Erro ao salvar serviço."),
  });

  const startEdit = (svc: any) => {
    setEditId(svc.id);
    setForm({
      name: svc.name,
      description: svc.description ?? "",
      price_label: svc.price_label ?? "",
      service_code: svc.service_code ?? "",
      category_name: svc.category_name ?? "",
      estimated_delivery_days: svc.estimated_delivery_days ? String(svc.estimated_delivery_days) : "",
      visible_to_customer: svc.visible_to_customer ?? true,
      active: svc.active,
      sort_order: String(svc.sort_order),
    });
    setShowForm(true);
  };

  const columns: DataColumn<any>[] = [
    {
      key: "name",
      header: "Serviço",
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{row.name}</span>
          </div>
          {row.description && <p className="text-xs text-muted-foreground mt-0.5 pl-6">{row.description}</p>}
        </div>
      ),
    },
    {
      key: "price_label",
      header: "Preço",
      render: (row) => <span className="text-sm text-foreground">{row.price_label || "—"}</span>,
    },
    {
      key: "category_name",
      header: "Categoria",
      render: (row) => row.category_name
        ? <StatusChip label={row.category_name} variant="neutral" size="sm" />
        : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: "estimated_delivery_days",
      header: "Prazo",
      render: (row) => row.estimated_delivery_days
        ? <span className="text-xs text-muted-foreground">{row.estimated_delivery_days} dias</span>
        : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: "visible_to_customer",
      header: "Visível",
      render: (row) => row.visible_to_customer
        ? <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />,
    },
    {
      key: "active",
      header: "Status",
      render: (row) => <StatusChip label={row.active ? "Ativo" : "Inativo"} variant={row.active ? "success" : "neutral"} size="sm" />,
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
        title="Catálogo de Serviços"
        description="Serviços disponíveis para solicitação pelo cliente ou pela equipe interna."
        breadcrumb={["Interno", "Cadastros", "Catálogo de Serviços"]}
        actions={canWrite ? (
          <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Serviço</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Serviço *</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={200} placeholder="Ex: Limpeza Pós-Obra" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} maxLength={500} placeholder="Detalhes sobre o serviço oferecido" />
                </div>
                <div>
                  <Label>Indicação de Preço</Label>
                  <Input value={form.price_label} onChange={(e) => setForm((f) => ({ ...f, price_label: e.target.value }))} maxLength={100} placeholder="Ex: R$ 350,00 / sob consulta" />
                </div>
                <div>
                  <Label>Código do Serviço</Label>
                  <Input value={form.service_code} onChange={(e) => setForm((f) => ({ ...f, service_code: e.target.value }))} maxLength={50} placeholder="Ex: SVC-001" />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input value={form.category_name} onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))} maxLength={100} placeholder="Ex: Manutenção, Acabamento" />
                </div>
                <div>
                  <Label>Prazo Estimado (dias)</Label>
                  <Input type="number" value={form.estimated_delivery_days} onChange={(e) => setForm((f) => ({ ...f, estimated_delivery_days: e.target.value }))} min={1} placeholder="Ex: 7" />
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
                  <Label>Ativo</Label>
                  <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
                </div>
                <Button className="w-full" disabled={!form.name || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editId ? "Salvar Alterações" : "Criar Serviço"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total" value={totalCount} icon={Wrench} />
        <KpiCard title="Ativos" value={activeCount} icon={CheckCircle2} />
        <KpiCard title="Categorias" value={categoriesSet.size} icon={Tag} />
        <KpiCard title="Visíveis ao Cliente" value={visibleCount} icon={Eye} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchBar placeholder="Buscar serviço..." value={search} onChange={setSearch} className="max-w-sm" />
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="Nenhum serviço cadastrado" description="Cadastre serviços para disponibilizar ao cliente e à equipe interna." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          emptyMessage="Nenhum serviço encontrado."
        />
      )}
    </div>
  );
}
