import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter } from "@/components/ui/chip-filter";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModalShell, DrawerShell } from "@/components/ui/modal-shell";
import { EmptyState } from "@/components/EmptyState";
import { Tags, Plus, ChevronDown, ChevronRight, Pencil, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const statusFilters = [
  { label: "Todos", value: "all" },
  { label: "Ativas", value: "active" },
  { label: "Inativas", value: "inactive" },
];

const audienceLabels: Record<string, string> = {
  customer: "Cliente",
  internal: "Interno",
  all: "Todos",
};

type Category = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  audience: string;
  active: boolean;
  sort_order: number;
};

type Subcategory = {
  id: string;
  ticket_category_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  active: boolean;
  sort_order: number;
};

export default function InternoCategoriasChamados() {
  const { user, isPlatformAdmin } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["all"]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Modal state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [parentCatId, setParentCatId] = useState<string | null>(null);

  // Form state
  const [catForm, setCatForm] = useState({ name: "", description: "", audience: "customer", active: true, sort_order: 0 });
  const [subForm, setSubForm] = useState({ name: "", description: "", active: true, sort_order: 0 });

  // ── Queries ──
  const { data: orgs } = useQuery({
    queryKey: ["cat-orgs"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name");
      return data ?? [];
    },
  });

  const { data: categories, isLoading: loadCats } = useQuery({
    queryKey: ["ticket-categories"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_categories").select("*").order("sort_order").order("name");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const { data: subcategories, isLoading: loadSubs } = useQuery({
    queryKey: ["ticket-subcategories"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_subcategories").select("*").order("sort_order").order("name");
      if (error) throw error;
      return (data ?? []) as Subcategory[];
    },
  });

  // ── Mutations ──
  const upsertCat = useMutation({
    mutationFn: async (payload: { id?: string; organization_id: string; name: string; description: string | null; audience: string; active: boolean; sort_order: number }) => {
      if (payload.id) {
        const { error } = await supabase.from("ticket_categories").update({
          name: payload.name, description: payload.description, audience: payload.audience,
          active: payload.active, sort_order: payload.sort_order,
        }).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ticket_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket-categories"] });
      qc.invalidateQueries({ queryKey: ["cadastros-ticket-categories"] });
      setCatModalOpen(false);
      setEditingCat(null);
      toast.success(editingCat ? "Categoria atualizada" : "Categoria criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsertSub = useMutation({
    mutationFn: async (payload: { id?: string; ticket_category_id: string; organization_id: string; name: string; description: string | null; active: boolean; sort_order: number }) => {
      if (payload.id) {
        const { error } = await supabase.from("ticket_subcategories").update({
          name: payload.name, description: payload.description,
          active: payload.active, sort_order: payload.sort_order,
        }).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ticket_subcategories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket-subcategories"] });
      setSubModalOpen(false);
      setEditingSub(null);
      toast.success(editingSub ? "Subcategoria atualizada" : "Subcategoria criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Filtering ──
  const filtered = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter.includes("all") ||
        (statusFilter.includes("active") && c.active) ||
        (statusFilter.includes("inactive") && !c.active);
      return matchSearch && matchStatus;
    });
  }, [categories, search, statusFilter]);

  const subsMap = useMemo(() => {
    const m = new Map<string, Subcategory[]>();
    subcategories?.forEach((s) => {
      const arr = m.get(s.ticket_category_id) ?? [];
      arr.push(s);
      m.set(s.ticket_category_id, arr);
    });
    return m;
  }, [subcategories]);

  const totalCats = categories?.length ?? 0;
  const activeCats = categories?.filter(c => c.active).length ?? 0;
  const totalSubs = subcategories?.length ?? 0;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCreateCat = () => {
    setEditingCat(null);
    setCatForm({ name: "", description: "", audience: "customer", active: true, sort_order: 0 });
    setCatModalOpen(true);
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, description: cat.description ?? "", audience: cat.audience, active: cat.active, sort_order: cat.sort_order });
    setCatModalOpen(true);
  };

  const openCreateSub = (catId: string) => {
    setEditingSub(null);
    setParentCatId(catId);
    setSubForm({ name: "", description: "", active: true, sort_order: 0 });
    setSubModalOpen(true);
  };

  const openEditSub = (sub: Subcategory) => {
    setEditingSub(sub);
    setParentCatId(sub.ticket_category_id);
    setSubForm({ name: sub.name, description: sub.description ?? "", active: sub.active, sort_order: sub.sort_order });
    setSubModalOpen(true);
  };

  const defaultOrgId = orgs?.[0]?.id ?? "";

  const handleSaveCat = () => {
    if (!catForm.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const orgId = editingCat?.organization_id ?? defaultOrgId;
    if (!orgId) { toast.error("Nenhuma organização disponível"); return; }
    upsertCat.mutate({
      id: editingCat?.id,
      organization_id: orgId,
      name: catForm.name.trim(),
      description: catForm.description.trim() || null,
      audience: catForm.audience,
      active: catForm.active,
      sort_order: catForm.sort_order,
    });
  };

  const handleSaveSub = () => {
    if (!subForm.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!parentCatId) return;
    const parentCat = categories?.find(c => c.id === parentCatId);
    const orgId = parentCat?.organization_id ?? defaultOrgId;
    if (!orgId) { toast.error("Nenhuma organização disponível"); return; }
    upsertSub.mutate({
      id: editingSub?.id,
      ticket_category_id: parentCatId,
      organization_id: orgId,
      name: subForm.name.trim(),
      description: subForm.description.trim() || null,
      active: subForm.active,
      sort_order: subForm.sort_order,
    });
  };

  const orgName = (orgId: string) => orgs?.find(o => o.id === orgId)?.name ?? "—";

  if (loadCats || loadSubs) {
    return (
      <div>
        <PageHeader title="Categorias de Chamados" breadcrumb={["Interno", "Cadastros", "Categorias de Chamados"]} />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Categorias de Chamados"
        description="Gerencie categorias e subcategorias para classificação de chamados."
        breadcrumb={["Interno", "Cadastros", "Categorias de Chamados"]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={openCreateCat}>
            <Plus className="h-4 w-4" /> Nova Categoria
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KpiCard title="Categorias" value={totalCats} icon={Tags} />
        <KpiCard title="Ativas" value={activeCats} icon={Tags} />
        <KpiCard title="Subcategorias" value={totalSubs} icon={Tags} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar categoria..." className="flex-1" />
        <ChipFilter options={statusFilters} selected={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Category list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria encontrada"
          description="Crie categorias para organizar os chamados de suporte."
          action={<Button size="sm" onClick={openCreateCat}><Plus className="h-4 w-4 mr-1" /> Nova Categoria</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((cat, i) => {
            const subs = subsMap.get(cat.id) ?? [];
            const isExpanded = expanded.has(cat.id);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="glass-card overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-semibold text-foreground">{cat.name}</h3>
                        <StatusChip variant={cat.active ? "success" : "neutral"} label={cat.active ? "Ativa" : "Inativa"} size="sm" />
                        <StatusChip variant="info" label={audienceLabels[cat.audience] ?? cat.audience} size="sm" dot={false} />
                      </div>
                      {cat.description && <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>}
                      <p className="text-[11px] text-muted-foreground mt-1">{orgName(cat.organization_id)} · {subs.length} subcategoria(s)</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openCreateSub(cat.id)}>
                        <Plus className="h-3 w-3 mr-1" /> Sub
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditCat(cat)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && subs.length > 0 && (
                    <div className="border-t border-border/40 bg-muted/20">
                      {subs.map((sub) => (
                        <div key={sub.id} className="px-4 py-2.5 pl-12 flex items-center gap-3 border-b border-border/20 last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground">{sub.name}</span>
                              <StatusChip variant={sub.active ? "success" : "neutral"} label={sub.active ? "Ativa" : "Inativa"} size="sm" />
                            </div>
                            {sub.description && <p className="text-xs text-muted-foreground">{sub.description}</p>}
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditSub(sub)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {isExpanded && subs.length === 0 && (
                    <div className="border-t border-border/40 px-4 py-4 text-center">
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        Nenhuma subcategoria cadastrada
                      </p>
                      <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => openCreateSub(cat.id)}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar Subcategoria
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      <ModalShell
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? "Editar Categoria" : "Nova Categoria"}
        description="organização › categoria › subcategoria"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCatModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCat} disabled={upsertCat.isPending}>
              {upsertCat.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={catForm.name} onChange={(e) => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Problemas elétricos" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={catForm.description} onChange={(e) => setCatForm(p => ({ ...p, description: e.target.value }))} placeholder="Breve descrição da categoria" rows={2} />
          </div>
          <div>
            <Label>Público-alvo</Label>
            <Select value={catForm.audience} onValueChange={(v) => setCatForm(p => ({ ...p, audience: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Cliente</SelectItem>
                <SelectItem value="internal">Interno</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ordem de exibição</Label>
            <Input type="number" value={catForm.sort_order} onChange={(e) => setCatForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={catForm.active} onCheckedChange={(v) => setCatForm(p => ({ ...p, active: v }))} />
            <Label>Ativa</Label>
          </div>
        </div>
      </ModalShell>

      {/* Subcategory Modal */}
      <ModalShell
        open={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        title={editingSub ? "Editar Subcategoria" : "Nova Subcategoria"}
        description={`Vinculada à categoria: ${categories?.find(c => c.id === parentCatId)?.name ?? ""}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSubModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSub} disabled={upsertSub.isPending}>
              {upsertSub.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={subForm.name} onChange={(e) => setSubForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Curto-circuito" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={subForm.description} onChange={(e) => setSubForm(p => ({ ...p, description: e.target.value }))} placeholder="Breve descrição" rows={2} />
          </div>
          <div>
            <Label>Ordem de exibição</Label>
            <Input type="number" value={subForm.sort_order} onChange={(e) => setSubForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={subForm.active} onCheckedChange={(v) => setSubForm(p => ({ ...p, active: v }))} />
            <Label>Ativa</Label>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
