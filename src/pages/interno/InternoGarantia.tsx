import { PageHeader } from "@/components/ui/page-header";
import { useInternalPermissions } from "@/hooks/useInternalPermissions";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusChip } from "@/components/ui/status-chip";
import { Shield, Loader2, Plus, Pencil } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function InternoGarantia() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ category_name: "", deadline_months: "", coverage_condition: "", recommendation: "", contract_clause: "" });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["warranty-rules-internal"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("warranty_rules").select("*").order("category_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = rules?.filter((r) => !search || r.category_name.toLowerCase().includes(search.toLowerCase())) ?? [];

  const resetForm = () => {
    setForm({ category_name: "", deadline_months: "", coverage_condition: "", recommendation: "", contract_clause: "" });
    setEditId(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Get org from memberships
      const { data: memberships } = await supabase.from("organization_memberships").select("organization_id").eq("user_id", user!.id).eq("active", true).limit(1);
      const orgId = memberships?.[0]?.organization_id;
      if (!orgId) throw new Error("Organização não encontrada");

      if (editId) {
        const { error } = await supabase.from("warranty_rules").update({
          category_name: form.category_name,
          deadline_months: parseInt(form.deadline_months),
          coverage_condition: form.coverage_condition || null,
          recommendation: form.recommendation || null,
          contract_clause: form.contract_clause || null,
        }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("warranty_rules").insert({
          organization_id: orgId,
          category_name: form.category_name,
          deadline_months: parseInt(form.deadline_months),
          coverage_condition: form.coverage_condition || null,
          recommendation: form.recommendation || null,
          contract_clause: form.contract_clause || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Regra atualizada!" : "Regra criada!");
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["warranty-rules-internal"] });
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
    });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Garantia"
        description="Regras e prazos de garantia por categoria."
        breadcrumb={["Painel Interno", "Garantia"]}
        actions={
          <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Regra</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar Regra" : "Nova Regra de Garantia"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Categoria *</Label>
                  <Input value={form.category_name} onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))} maxLength={100} />
                </div>
                <div>
                  <Label>Prazo (meses) *</Label>
                  <Input type="number" value={form.deadline_months} onChange={(e) => setForm((f) => ({ ...f, deadline_months: e.target.value }))} min={1} />
                </div>
                <div>
                  <Label>Condição de Cobertura</Label>
                  <Textarea value={form.coverage_condition} onChange={(e) => setForm((f) => ({ ...f, coverage_condition: e.target.value }))} rows={2} maxLength={500} />
                </div>
                <div>
                  <Label>Recomendação</Label>
                  <Textarea value={form.recommendation} onChange={(e) => setForm((f) => ({ ...f, recommendation: e.target.value }))} rows={2} maxLength={500} />
                </div>
                <div>
                  <Label>Cláusula Contratual</Label>
                  <Input value={form.contract_clause} onChange={(e) => setForm((f) => ({ ...f, contract_clause: e.target.value }))} maxLength={200} />
                </div>
                <Button className="w-full" disabled={!form.category_name || !form.deadline_months || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editId ? "Salvar Alterações" : "Criar Regra"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6">
        <SearchBar placeholder="Buscar categoria..." value={search} onChange={setSearch} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Shield} title="Nenhuma regra de garantia" description="As regras de garantia serão listadas aqui." />
      ) : (
        <div className="space-y-3">
          {filtered.map((rule) => (
            <GlassCard key={rule.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-4 w-4 text-primary" /></div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{rule.category_name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rule.deadline_months} meses
                      {rule.coverage_condition && ` · ${rule.coverage_condition}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip label={rule.active ? "Ativa" : "Inativa"} variant={rule.active ? "success" : "neutral"} size="sm" />
                  <Button variant="ghost" size="sm" onClick={() => startEdit(rule)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {rule.recommendation && (
                <p className="text-xs text-muted-foreground mt-2 pl-11">{rule.recommendation}</p>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
