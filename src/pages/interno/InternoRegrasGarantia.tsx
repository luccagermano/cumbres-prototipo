import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { GlassCard } from "@/components/ui/glass-card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusChip } from "@/components/ui/status-chip";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Loader2, Plus, Pencil, Eye, EyeOff, ShieldCheck, ShieldAlert, Layers } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const emptyForm = {
  category_name: "",
  deadline_months: "",
  coverage_condition: "",
  recommendation: "",
  contract_clause: "",
  room_name: "",
  service_type: "",
  priority_hint: "",
  visible_to_customer: true,
  active: true,
};

export default function InternoRegrasGarantia() {
  const { user, isPlatformAdmin, memberships } = useAuth();
  const canWrite = isPlatformAdmin || memberships.some(m => m.active && m.role === "org_admin");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [filterVisible, setFilterVisible] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["warranty-rules-mgmt"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warranty_rules")
        .select("*")
        .order("category_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (rules ?? []).filter((r: any) => {
    if (search && !r.category_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterActive === "active" && !r.active) return false;
    if (filterActive === "inactive" && r.active) return false;
    if (filterVisible === "visible" && !r.visible_to_customer) return false;
    if (filterVisible === "hidden" && r.visible_to_customer) return false;
    return true;
  });

  const totalCount = rules?.length ?? 0;
  const activeCount = rules?.filter((r: any) => r.active).length ?? 0;
  const categories = new Set(rules?.map((r: any) => r.category_name) ?? []);
  const visibleCount = rules?.filter((r: any) => r.visible_to_customer).length ?? 0;

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
        category_name: form.category_name,
        deadline_months: parseInt(form.deadline_months),
        coverage_condition: form.coverage_condition || null,
        recommendation: form.recommendation || null,
        contract_clause: form.contract_clause || null,
        room_name: form.room_name || null,
        service_type: form.service_type || null,
        priority_hint: form.priority_hint || null,
        visible_to_customer: form.visible_to_customer,
        active: form.active,
      };

      if (editId) {
        const { error } = await supabase.from("warranty_rules").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("warranty_rules").insert({ ...payload, organization_id: orgId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Regra atualizada!" : "Regra criada!");
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["warranty-rules-mgmt"] });
    },
    onError: () => toast.error("Erro ao salvar regra."),
  });

  const startEdit = (rule: any) => {
    setEditId(rule.id);
    setForm({
      category_name: rule.category_name,
      deadline_months: String(rule.deadline_months),
      coverage_condition: rule.coverage_condition ?? "",
      recommendation: rule.recommendation ?? "",
      contract_clause: rule.contract_clause ?? "",
      room_name: rule.room_name ?? "",
      service_type: rule.service_type ?? "",
      priority_hint: rule.priority_hint ?? "",
      visible_to_customer: rule.visible_to_customer ?? true,
      active: rule.active,
    });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Regras de Garantia"
        description="Prazos, condições e recomendações de garantia por categoria."
        breadcrumb={["Interno", "Cadastros", "Regras de Garantia"]}
        actions={canWrite ? (
          <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Regra</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Editar Regra" : "Nova Regra de Garantia"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Categoria *</Label>
                  <Input value={form.category_name} onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))} maxLength={100} placeholder="Ex: Instalações Hidráulicas" />
                </div>
                <div>
                  <Label>Prazo (meses) *</Label>
                  <Input type="number" value={form.deadline_months} onChange={(e) => setForm((f) => ({ ...f, deadline_months: e.target.value }))} min={1} placeholder="Ex: 60" />
                </div>
                <div>
                  <Label>Condição de Cobertura</Label>
                  <Textarea value={form.coverage_condition} onChange={(e) => setForm((f) => ({ ...f, coverage_condition: e.target.value }))} rows={2} maxLength={500} placeholder="Descreva as condições para cobertura da garantia" />
                </div>
                <div>
                  <Label>Recomendação</Label>
                  <Textarea value={form.recommendation} onChange={(e) => setForm((f) => ({ ...f, recommendation: e.target.value }))} rows={2} maxLength={500} placeholder="Orientações de manutenção preventiva" />
                </div>
                <div>
                  <Label>Cláusula Contratual</Label>
                  <Input value={form.contract_clause} onChange={(e) => setForm((f) => ({ ...f, contract_clause: e.target.value }))} maxLength={200} placeholder="Referência à cláusula do contrato" />
                </div>
                <div>
                  <Label>Ambiente / Cômodo</Label>
                  <Input value={form.room_name} onChange={(e) => setForm((f) => ({ ...f, room_name: e.target.value }))} maxLength={100} placeholder="Ex: Banheiro, Cozinha" />
                </div>
                <div>
                  <Label>Tipo de Serviço</Label>
                  <Input value={form.service_type} onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value }))} maxLength={100} placeholder="Ex: Elétrica, Hidráulica" />
                </div>
                <div>
                  <Label>Prioridade Sugerida</Label>
                  <Select value={form.priority_hint} onValueChange={(v) => setForm((f) => ({ ...f, priority_hint: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Visível ao Cliente</Label>
                  <Switch checked={form.visible_to_customer} onCheckedChange={(v) => setForm((f) => ({ ...f, visible_to_customer: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativa</Label>
                  <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
                </div>
                <Button className="w-full" disabled={!form.category_name || !form.deadline_months || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editId ? "Salvar Alterações" : "Criar Regra"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : undefined}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total de Regras" value={totalCount} icon={Shield} />
        <KpiCard title="Regras Ativas" value={activeCount} icon={ShieldCheck} />
        <KpiCard title="Categorias Cobertas" value={categories.size} icon={Layers} />
        <KpiCard title="Visíveis ao Cliente" value={visibleCount} icon={Eye} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchBar placeholder="Buscar categoria..." value={search} onChange={setSearch} className="max-w-sm" />
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterVisible} onValueChange={setFilterVisible}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visibilidade</SelectItem>
            <SelectItem value="visible">Visível</SelectItem>
            <SelectItem value="hidden">Oculta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Shield} title="Nenhuma regra de garantia" description="Cadastre regras de garantia para classificação e controle de prazos." />
      ) : (
        <div className="space-y-3">
          {filtered.map((rule: any) => (
            <GlassCard key={rule.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground">{rule.category_name}</span>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-medium">{rule.deadline_months} meses</span>
                      {rule.room_name && <span className="text-xs text-muted-foreground">· {rule.room_name}</span>}
                      {rule.service_type && <span className="text-xs text-muted-foreground">· {rule.service_type}</span>}
                      {rule.priority_hint && (
                        <StatusChip
                          label={rule.priority_hint === "urgent" ? "Urgente" : rule.priority_hint === "high" ? "Alta" : rule.priority_hint === "medium" ? "Média" : "Baixa"}
                          variant={rule.priority_hint === "urgent" || rule.priority_hint === "high" ? "error" : rule.priority_hint === "medium" ? "warning" : "neutral"}
                          size="sm"
                        />
                      )}
                    </div>
                    {rule.coverage_condition && (
                      <p className="text-xs text-muted-foreground mt-1.5">{rule.coverage_condition}</p>
                    )}
                    {rule.recommendation && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{rule.recommendation}</p>
                    )}
                    {rule.contract_clause && (
                      <p className="text-[11px] text-muted-foreground mt-1">Cláusula: {rule.contract_clause}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {rule.visible_to_customer ? (
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <StatusChip label={rule.active ? "Ativa" : "Inativa"} variant={rule.active ? "success" : "neutral"} size="sm" />
                  {canWrite && (
                    <Button variant="ghost" size="sm" onClick={() => startEdit(rule)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
