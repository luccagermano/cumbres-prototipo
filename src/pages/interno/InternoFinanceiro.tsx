import { useState, useMemo } from "react";
import { useInternalPermissions } from "@/hooks/useInternalPermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChipFilter } from "@/components/ui/chip-filter";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus, CreditCard, AlertTriangle, Calendar, Eye, Pencil, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type ReceivableRow = {
  id: string;
  contract_id: string;
  unit_id: string;
  sequence_no: number | null;
  title: string;
  charge_type: string;
  due_date: string;
  original_amount: number;
  discount_amount: number;
  interest_amount: number;
  total_amount: number;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ContractRow = {
  id: string;
  contract_number: string;
  unit_id: string;
  contract_status: string;
  total_contract_value: number;
  organization_id: string;
};

const filterOptions = [
  { label: "Todas", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Pagas", value: "paid" },
  { label: "Vencidas", value: "overdue" },
  { label: "Canceladas", value: "cancelled" },
];

export default function InternoFinanceiro() {
  const { memberships, isPlatformAdmin } = useAuth();
  const { canWrite, isReadOnly } = useInternalPermissions();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<string[]>(["all"]);
  const [showReceivableModal, setShowReceivableModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<ReceivableRow | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<ReceivableRow | null>(null);
  const [contractFilter, setContractFilter] = useState<string>("all");

  const orgIds = memberships.map((m) => m.organization_id);

  // Fetch contracts — platform admins fetch all (RLS handles access)
  const { data: contracts } = useQuery({
    queryKey: ["interno-contracts", isPlatformAdmin ? "all" : orgIds],
    enabled: isPlatformAdmin || orgIds.length > 0,
    queryFn: async () => {
      let query = supabase
        .from("sales_contracts")
        .select("id, contract_number, unit_id, contract_status, total_contract_value, organization_id");
      if (!isPlatformAdmin && orgIds.length > 0) {
        query = query.in("organization_id", orgIds);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ContractRow[];
    },
  });

  // Fetch receivables
  const { data: receivables, isLoading } = useQuery({
    queryKey: ["interno-receivables", isPlatformAdmin ? "all" : orgIds],
    enabled: isPlatformAdmin || orgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receivables")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReceivableRow[];
    },
  });

  // Create/update receivable
  const saveMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      if (form.id) {
        const { error } = await supabase.from("receivables").update({
          title: form.title,
          charge_type: form.charge_type,
          due_date: form.due_date,
          original_amount: Number(form.original_amount),
          discount_amount: Number(form.discount_amount || 0),
          interest_amount: Number(form.interest_amount || 0),
          total_amount: Number(form.total_amount),
          status: form.status,
          notes: form.notes || null,
        }).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receivables").insert({
          contract_id: form.contract_id,
          unit_id: form.unit_id,
          title: form.title,
          charge_type: form.charge_type,
          due_date: form.due_date,
          original_amount: Number(form.original_amount),
          discount_amount: Number(form.discount_amount || 0),
          interest_amount: Number(form.interest_amount || 0),
          total_amount: Number(form.total_amount),
          status: form.status || "pending",
          notes: form.notes || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interno-receivables"] });
      setShowReceivableModal(false);
      setEditingReceivable(null);
      toast.success("Parcela salva com sucesso.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Register payment
  const paymentMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      const { error: pErr } = await supabase.from("payments").insert({
        receivable_id: form.receivable_id,
        paid_amount: Number(form.paid_amount),
        paid_at: form.paid_at,
        payment_method: form.payment_method || null,
        reference_code: form.reference_code || null,
        notes: form.notes || null,
      });
      if (pErr) throw pErr;

      // Update receivable status
      const { error: uErr } = await supabase
        .from("receivables")
        .update({ status: "paid", paid_at: form.paid_at })
        .eq("id", form.receivable_id);
      if (uErr) throw uErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interno-receivables"] });
      setShowPaymentModal(false);
      setSelectedReceivable(null);
      toast.success("Pagamento registrado com sucesso.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Mark overdue
  const markOverdueMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const overdue = (receivables ?? []).filter(
        (r) => r.status === "pending" && r.due_date < today
      );
      for (const r of overdue) {
        await supabase.from("receivables").update({ status: "overdue" }).eq("id", r.id);
      }
      return overdue.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["interno-receivables"] });
      toast.success(`${count} parcela(s) marcada(s) como vencida(s).`);
    },
  });

  const now = new Date();
  const categorized = useMemo(() => {
    let list = receivables ?? [];
    if (contractFilter !== "all") list = list.filter((r) => r.contract_id === contractFilter);

    const paid = list.filter((r) => r.status === "paid");
    const pending = list.filter((r) => r.status === "pending");
    const overdue = list.filter((r) => r.status === "overdue" || (r.status === "pending" && new Date(r.due_date) < now));
    const cancelled = list.filter((r) => r.status === "cancelled");
    return { all: list, paid, pending, overdue, cancelled };
  }, [receivables, contractFilter]);

  const paidTotal = categorized.paid.reduce((s, r) => s + Number(r.total_amount), 0);
  const pendingTotal = categorized.pending.reduce((s, r) => s + Number(r.total_amount), 0);
  const overdueTotal = categorized.overdue.reduce((s, r) => s + Number(r.total_amount), 0);

  const filtered = useMemo(() => {
    if (filters.includes("all") || filters.length === 0) return categorized.all;
    let result: ReceivableRow[] = [];
    if (filters.includes("paid")) result = [...result, ...categorized.paid];
    if (filters.includes("pending")) result = [...result, ...categorized.pending];
    if (filters.includes("overdue")) result = [...result, ...categorized.overdue];
    if (filters.includes("cancelled")) result = [...result, ...categorized.cancelled];
    return result.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [filters, categorized]);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Gestão de parcelas e pagamentos."
        breadcrumb={["Painel Interno", "Financeiro"]}
        actions={canWrite ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => markOverdueMutation.mutate()}>
              <AlertTriangle className="h-4 w-4 mr-1" /> Marcar Vencidas
            </Button>
            <Button size="sm" onClick={() => { setEditingReceivable(null); setShowReceivableModal(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nova Parcela
            </Button>
          </div>
        ) : isReadOnly ? (
          <StatusChip label="Somente consulta" variant="neutral" />
        ) : undefined}
      />

      {/* KPI Row */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <KpiCard title="Total Recebido" value={BRL.format(paidTotal)} icon={DollarSign} subtitle={`${categorized.paid.length} parcela(s)`} trend="up" trendValue={`${categorized.paid.length}`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <KpiCard title="A Receber" value={BRL.format(pendingTotal)} icon={Calendar} subtitle={`${categorized.pending.length} parcela(s)`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <KpiCard title="Em Atraso" value={BRL.format(overdueTotal)} icon={AlertTriangle} subtitle={`${categorized.overdue.length} parcela(s)`} trend={categorized.overdue.length > 0 ? "down" : "neutral"} trendValue={`${categorized.overdue.length}`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <KpiCard title="Contratos" value={contracts?.length ?? 0} icon={CreditCard} subtitle="Ativos na organização" />
        </motion.div>
      </div>

      {/* Contract filter + Chip filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {contracts && contracts.length > 1 && (
          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filtrar por contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os contratos</SelectItem>
              {contracts.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.contract_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <ChipFilter
          options={filterOptions.map((f) => ({
            ...f,
            count: f.value === "all" ? categorized.all.length
              : f.value === "paid" ? categorized.paid.length
              : f.value === "pending" ? categorized.pending.length
              : f.value === "overdue" ? categorized.overdue.length
              : categorized.cancelled.length,
          }))}
          selected={filters}
          onChange={(sel) => setFilters(sel.length === 0 ? ["all"] : sel.filter((s) => s !== "all" || sel.length === 1))}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="glass-card p-12 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="Nenhum registro financeiro" description="Os dados financeiros aparecerão aqui." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parcela</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vencimento</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{r.title}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.charge_type}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{format(new Date(r.due_date), "dd/MM/yyyy")}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right font-medium">{BRL.format(Number(r.total_amount))}</td>
                    <td className="px-4 py-3 text-center"><StatusChip label={r.status === "pending" && new Date(r.due_date) < now ? "Vencida" : r.status === "paid" ? "Paga" : r.status === "overdue" ? "Vencida" : r.status === "cancelled" ? "Cancelada" : "Pendente"} variant={r.status === "paid" ? "success" : (r.status === "overdue" || (r.status === "pending" && new Date(r.due_date) < now)) ? "error" : r.status === "cancelled" ? "neutral" : "pending"} /></td>
                    <td className="px-4 py-3 text-center">
                      {canWrite && (
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingReceivable(r); setShowReceivableModal(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {r.status !== "paid" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedReceivable(r); setShowPaymentModal(true); }}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Receivable Modal */}
      <ReceivableModal
        open={showReceivableModal}
        onClose={() => { setShowReceivableModal(false); setEditingReceivable(null); }}
        receivable={editingReceivable}
        contracts={contracts ?? []}
        onSave={(form) => saveMutation.mutate(form)}
        saving={saveMutation.isPending}
      />

      {/* Register Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedReceivable(null); }}
        receivable={selectedReceivable}
        onSave={(form) => paymentMutation.mutate(form)}
        saving={paymentMutation.isPending}
      />
    </div>
  );
}

/* ─── Receivable Modal ─── */
function ReceivableModal({
  open, onClose, receivable, contracts, onSave, saving,
}: {
  open: boolean;
  onClose: () => void;
  receivable: ReceivableRow | null;
  contracts: ContractRow[];
  onSave: (form: Record<string, any>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, any>>({});

  // Reset form when receivable changes
  const effectiveForm = useMemo(() => {
    if (receivable) return {
      id: receivable.id,
      contract_id: receivable.contract_id,
      unit_id: receivable.unit_id,
      title: receivable.title,
      charge_type: receivable.charge_type,
      due_date: receivable.due_date,
      original_amount: receivable.original_amount,
      discount_amount: receivable.discount_amount,
      interest_amount: receivable.interest_amount,
      total_amount: receivable.total_amount,
      status: receivable.status,
      notes: receivable.notes || "",
      ...form,
    };
    return form;
  }, [receivable, form]);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedContract = contracts.find((c) => c.id === effectiveForm.contract_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...effectiveForm };
    if (!data.contract_id && !receivable) {
      toast.error("Selecione um contrato.");
      return;
    }
    if (selectedContract && !data.unit_id) data.unit_id = selectedContract.unit_id;
    onSave(data);
    setForm({});
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setForm({}); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{receivable ? "Editar Parcela" : "Nova Parcela"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!receivable && (
            <div>
              <Label>Contrato</Label>
              <Select value={effectiveForm.contract_id || ""} onValueChange={(v) => set("contract_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o contrato" /></SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.contract_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Título</Label>
              <Input value={effectiveForm.title || ""} onChange={(e) => set("title", e.target.value)} required />
            </div>
            <div>
              <Label>Tipo de Cobrança</Label>
              <Select value={effectiveForm.charge_type || ""} onValueChange={(v) => set("charge_type", v)}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="installment">Parcela</SelectItem>
                  <SelectItem value="down_payment">Entrada</SelectItem>
                  <SelectItem value="balloon">Reforço</SelectItem>
                  <SelectItem value="key_delivery">Chaves</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vencimento</Label>
              <Input type="date" value={effectiveForm.due_date || ""} onChange={(e) => set("due_date", e.target.value)} required />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={effectiveForm.status || "pending"} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Valor Original</Label>
              <Input type="number" step="0.01" value={effectiveForm.original_amount ?? ""} onChange={(e) => {
                const v = e.target.value;
                set("original_amount", v);
                const disc = Number(effectiveForm.discount_amount || 0);
                const int = Number(effectiveForm.interest_amount || 0);
                set("total_amount", Number(v) - disc + int);
              }} required />
            </div>
            <div>
              <Label>Desconto</Label>
              <Input type="number" step="0.01" value={effectiveForm.discount_amount ?? ""} onChange={(e) => {
                set("discount_amount", e.target.value);
                set("total_amount", Number(effectiveForm.original_amount || 0) - Number(e.target.value) + Number(effectiveForm.interest_amount || 0));
              }} />
            </div>
            <div>
              <Label>Juros</Label>
              <Input type="number" step="0.01" value={effectiveForm.interest_amount ?? ""} onChange={(e) => {
                set("interest_amount", e.target.value);
                set("total_amount", Number(effectiveForm.original_amount || 0) - Number(effectiveForm.discount_amount || 0) + Number(e.target.value));
              }} />
            </div>
          </div>
          <div>
            <Label>Valor Total</Label>
            <Input type="number" step="0.01" value={effectiveForm.total_amount ?? ""} onChange={(e) => set("total_amount", e.target.value)} required />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={effectiveForm.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); setForm({}); }}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Payment Modal ─── */
function PaymentModal({
  open, onClose, receivable, onSave, saving,
}: {
  open: boolean;
  onClose: () => void;
  receivable: ReceivableRow | null;
  onSave: (form: Record<string, any>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivable) return;
    onSave({
      receivable_id: receivable.id,
      paid_amount: form.paid_amount || receivable.total_amount,
      paid_at: form.paid_at || new Date().toISOString(),
      payment_method: form.payment_method || null,
      reference_code: form.reference_code || null,
      notes: form.notes || null,
    });
    setForm({});
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setForm({}); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        {receivable && (
          <div className="glass-card p-3 mb-2 text-sm">
            <span className="font-medium text-foreground">{receivable.title}</span>
            <span className="text-muted-foreground ml-2">— {BRL.format(Number(receivable.total_amount))}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor Pago</Label>
              <Input type="number" step="0.01" value={form.paid_amount ?? (receivable ? receivable.total_amount : "")} onChange={(e) => set("paid_amount", e.target.value)} required />
            </div>
            <div>
              <Label>Data do Pagamento</Label>
              <Input type="date" value={form.paid_at?.split("T")[0] ?? new Date().toISOString().split("T")[0]} onChange={(e) => set("paid_at", e.target.value + "T00:00:00Z")} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Método</Label>
              <Select value={form.payment_method || ""} onValueChange={(v) => set("payment_method", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Código de Referência</Label>
              <Input value={form.reference_code || ""} onChange={(e) => set("reference_code", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); setForm({}); }}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Registrando..." : "Confirmar Pagamento"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
