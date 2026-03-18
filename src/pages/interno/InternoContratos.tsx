import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  FileSignature,
  Plus,
  Pencil,
  CheckCircle2,
  Landmark,
  HandCoins,
  Home,
  Users,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Contract = Tables<"sales_contracts">;

type ContractEnriched = Contract & {
  unit_code: string;
  block_name: string;
  dev_name: string;
  dev_id: string;
  org_name: string;
  customer_name: string | null;
};

const CONTRACT_STATUSES: ChipFilterOption[] = [
  { label: "Ativo", value: "active" },
  { label: "Concluído", value: "completed" },
  { label: "Cancelado", value: "cancelled" },
  { label: "Distrato", value: "terminated" },
];

const FINANCING_STATUSES: ChipFilterOption[] = [
  { label: "Aprovado", value: "approved" },
  { label: "Em análise", value: "pending" },
  { label: "Reprovado", value: "rejected" },
  { label: "N/A", value: "not_applicable" },
];

const contractStatusMap: Record<string, { variant: "success" | "info" | "error" | "neutral" | "warning" | "pending"; label: string }> = {
  active: { variant: "success", label: "Ativo" },
  completed: { variant: "info", label: "Concluído" },
  cancelled: { variant: "error", label: "Cancelado" },
  terminated: { variant: "warning", label: "Distrato" },
};

const financingStatusMap: Record<string, { variant: "success" | "info" | "error" | "neutral" | "warning" | "pending"; label: string }> = {
  approved: { variant: "success", label: "Aprovado" },
  pending: { variant: "pending", label: "Em análise" },
  rejected: { variant: "error", label: "Reprovado" },
  not_applicable: { variant: "neutral", label: "N/A" },
};

type FormData = {
  organization_id: string;
  unit_id: string;
  contract_number: string;
  contract_status: string;
  total_contract_value: string;
  down_payment_amount: string;
  financed_amount: string;
  bank_name: string;
  financing_status: string;
  signed_at: string;
  handover_forecast_at: string;
  handover_at: string;
};

const emptyForm: FormData = {
  organization_id: "",
  unit_id: "",
  contract_number: "",
  contract_status: "active",
  total_contract_value: "",
  down_payment_amount: "",
  financed_amount: "",
  bank_name: "",
  financing_status: "",
  signed_at: "",
  handover_forecast_at: "",
  handover_at: "",
};

const formatBRL = (value: number | null | undefined) => {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function InternoContratos() {
  const { user, isPlatformAdmin, memberships } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledUnitId = searchParams.get("unit") ?? "";
  const prefilledDevId = searchParams.get("dev") ?? "";

  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState<string[]>([]);
  const [devFilter, setDevFilter] = useState<string[]>(prefilledDevId ? [prefilledDevId] : []);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [finStatusFilter, setFinStatusFilter] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const canWrite =
    isPlatformAdmin ||
    memberships.some((m) => (m.role === "org_admin" || m.role === "finance_agent") && m.active);

  // ── Queries ──────────────────────────────────────────
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["interno-contratos"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_contracts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["interno-units-lookup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id, code, block_id").order("code");
      return (data ?? []) as { id: string; code: string; block_id: string }[];
    },
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["interno-blocks-lookup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("id, name, development_id").order("name");
      return (data ?? []) as { id: string; name: string; development_id: string }[];
    },
  });

  const { data: developments = [] } = useQuery({
    queryKey: ["interno-devs-lookup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("developments").select("id, name, organization_id").order("name");
      return (data ?? []) as { id: string; name: string; organization_id: string }[];
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

  const { data: primaryCustomers = {} } = useQuery({
    queryKey: ["interno-contract-customers"],
    enabled: !!user,
    queryFn: async () => {
      const { data: membershipsData } = await supabase
        .from("unit_memberships")
        .select("unit_id, user_id")
        .eq("active", true)
        .eq("is_primary", true);
      if (!membershipsData || membershipsData.length === 0) return {};

      const userIds = [...new Set(membershipsData.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map<string, string>();
      (profiles ?? []).forEach((p) => profileMap.set(p.id, p.full_name));

      const result: Record<string, string> = {};
      membershipsData.forEach((m) => {
        const name = profileMap.get(m.user_id);
        if (name) result[m.unit_id] = name;
      });
      return result;
    },
  });

  // ── Lookups ──
  const unitMap = useMemo(() => {
    const m = new Map<string, { code: string; block_id: string }>();
    units.forEach((u) => m.set(u.id, { code: u.code, block_id: u.block_id }));
    return m;
  }, [units]);

  const blockMap = useMemo(() => {
    const m = new Map<string, { name: string; dev_id: string }>();
    blocks.forEach((b) => m.set(b.id, { name: b.name, dev_id: b.development_id }));
    return m;
  }, [blocks]);

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
  const enriched: ContractEnriched[] = useMemo(() => {
    return contracts.map((c) => {
      const unit = unitMap.get(c.unit_id);
      const block = unit ? blockMap.get(unit.block_id) : undefined;
      const dev = block ? devMap.get(block.dev_id) : undefined;
      return {
        ...c,
        unit_code: unit?.code ?? "—",
        block_name: block?.name ?? "—",
        dev_name: dev?.name ?? "—",
        dev_id: block?.dev_id ?? "",
        org_name: dev ? orgMap.get(dev.org_id) ?? "—" : "—",
        customer_name: primaryCustomers[c.unit_id] ?? null,
      };
    });
  }, [contracts, unitMap, blockMap, devMap, orgMap, primaryCustomers]);

  // ── Filters ──
  const filtered = useMemo(() => {
    let result = enriched;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.contract_number.toLowerCase().includes(q) ||
          c.unit_code.toLowerCase().includes(q) ||
          c.dev_name.toLowerCase().includes(q) ||
          (c.customer_name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (orgFilter.length > 0)
      result = result.filter((c) => orgFilter.includes(c.organization_id));
    if (devFilter.length > 0)
      result = result.filter((c) => devFilter.includes(c.dev_id));
    if (statusFilter.length > 0)
      result = result.filter((c) => statusFilter.includes(c.contract_status));
    if (finStatusFilter.length > 0)
      result = result.filter((c) => c.financing_status && finStatusFilter.includes(c.financing_status));
    return result;
  }, [enriched, search, orgFilter, devFilter, statusFilter, finStatusFilter]);

  // ── KPIs ──
  const kpis = [
    { title: "Total de Contratos", value: contracts.length, icon: FileSignature },
    { title: "Assinados", value: contracts.filter((c) => c.signed_at).length, icon: CheckCircle2 },
    { title: "Em Financiamento", value: contracts.filter((c) => c.financing_status === "pending").length, icon: Landmark },
    { title: "Entregues", value: contracts.filter((c) => c.handover_at).length, icon: HandCoins },
  ];

  // ── Form helpers ──
  const getOrgIdForUnit = (unitId: string): string => {
    const unit = unitMap.get(unitId);
    if (!unit) return "";
    const block = blockMap.get(unit.block_id);
    if (!block) return "";
    const dev = devMap.get(block.dev_id);
    return dev?.org_id ?? "";
  };

  const unitsForForm = useMemo(() => {
    if (!form.organization_id) return units;
    const devIdsInOrg = developments.filter((d) => d.organization_id === form.organization_id).map((d) => d.id);
    const blockIdsInOrg = blocks.filter((b) => devIdsInOrg.includes(b.development_id)).map((b) => b.id);
    return units.filter((u) => blockIdsInOrg.includes(u.block_id));
  }, [form.organization_id, units, developments, blocks]);

  const openCreate = () => {
    setEditing(null);
    const prefillForm = { ...emptyForm };
    if (prefilledUnitId) {
      prefillForm.unit_id = prefilledUnitId;
      prefillForm.organization_id = getOrgIdForUnit(prefilledUnitId);
    }
    setForm(prefillForm);
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (contract: Contract) => {
    setEditing(contract);
    setForm({
      organization_id: contract.organization_id,
      unit_id: contract.unit_id,
      contract_number: contract.contract_number,
      contract_status: contract.contract_status,
      total_contract_value: contract.total_contract_value?.toString() ?? "",
      down_payment_amount: contract.down_payment_amount?.toString() ?? "",
      financed_amount: contract.financed_amount?.toString() ?? "",
      bank_name: contract.bank_name ?? "",
      financing_status: contract.financing_status ?? "",
      signed_at: contract.signed_at ? contract.signed_at.split("T")[0] : "",
      handover_forecast_at: contract.handover_forecast_at ? contract.handover_forecast_at.split("T")[0] : "",
      handover_at: contract.handover_at ? contract.handover_at.split("T")[0] : "",
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
    if (!form.unit_id) errors.unit_id = "Selecione uma unidade.";
    if (!form.contract_number.trim()) errors.contract_number = "Número do contrato é obrigatório.";
    if (!form.total_contract_value || isNaN(Number(form.total_contract_value)) || Number(form.total_contract_value) <= 0)
      errors.total_contract_value = "Informe um valor válido.";
    if (form.down_payment_amount && (isNaN(Number(form.down_payment_amount)) || Number(form.down_payment_amount) < 0))
      errors.down_payment_amount = "Informe um valor válido.";
    if (form.financed_amount && (isNaN(Number(form.financed_amount)) || Number(form.financed_amount) < 0))
      errors.financed_amount = "Informe um valor válido.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        organization_id: data.organization_id,
        unit_id: data.unit_id,
        contract_number: data.contract_number.trim(),
        contract_status: data.contract_status,
        total_contract_value: parseFloat(data.total_contract_value),
        down_payment_amount: data.down_payment_amount ? parseFloat(data.down_payment_amount) : 0,
        financed_amount: data.financed_amount ? parseFloat(data.financed_amount) : 0,
        bank_name: data.bank_name.trim() || null,
        financing_status: data.financing_status || null,
        signed_at: data.signed_at || null,
        handover_forecast_at: data.handover_forecast_at || null,
        handover_at: data.handover_at || null,
      };
      if (editing) {
        const { error } = await supabase.from("sales_contracts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sales_contracts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Contrato atualizado." : "Contrato criado.");
      queryClient.invalidateQueries({ queryKey: ["interno-contratos"] });
      closeDrawer();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar contrato.");
    },
  });

  const handleSave = () => {
    if (!validate()) return;
    saveMutation.mutate(form);
  };

  // ── Org filter options ──
  const orgOptions: ChipFilterOption[] = organizations.map((o) => ({ label: o.name, value: o.id }));
  const devOptions: ChipFilterOption[] = useMemo(() => {
    if (orgFilter.length > 0) {
      return developments
        .filter((d) => orgFilter.includes(d.organization_id))
        .map((d) => ({ label: d.name, value: d.id }));
    }
    return developments.map((d) => ({ label: d.name, value: d.id }));
  }, [developments, orgFilter]);

  // ── Table columns ──
  const columns: DataColumn<ContractEnriched>[] = [
    {
      key: "contract_number",
      header: "Contrato",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-medium text-foreground">{row.contract_number}</span>
          <p className="text-[11px] text-muted-foreground">{row.org_name} › {row.dev_name} › {row.block_name} › {row.unit_code}</p>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: "Cliente",
      render: (row) => (
        <span className="text-sm">{row.customer_name ?? <span className="text-muted-foreground italic">Sem vínculo</span>}</span>
      ),
    },
    {
      key: "total_contract_value",
      header: "Valor Total",
      render: (row) => <span className="font-medium tabular-nums">{formatBRL(row.total_contract_value)}</span>,
    },
    {
      key: "contract_status",
      header: "Status",
      render: (row) => {
        const s = contractStatusMap[row.contract_status];
        return s ? <StatusChip label={s.label} variant={s.variant} /> : <span>{row.contract_status}</span>;
      },
    },
    {
      key: "financing_status",
      header: "Financiamento",
      render: (row) => {
        if (!row.financing_status) return <span className="text-muted-foreground">—</span>;
        const s = financingStatusMap[row.financing_status];
        return s ? <StatusChip label={s.label} variant={s.variant} /> : <span>{row.financing_status}</span>;
      },
    },
    {
      key: "signed_at",
      header: "Assinatura",
      render: (row) =>
        row.signed_at ? (
          <span className="text-sm tabular-nums">{format(new Date(row.signed_at), "dd/MM/yyyy", { locale: ptBR })}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[180px]",
      render: (row) => (
        <div className="flex items-center gap-1">
          {canWrite && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
              <Pencil className="h-3 w-3" /> Editar
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); navigate(`/interno/cadastros/unidades?dev=${row.dev_id}`); }}>
            <Home className="h-3 w-3" /> Unidade
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); navigate("/interno/financeiro"); }}>
            <DollarSign className="h-3 w-3" /> Financeiro
          </Button>
        </div>
      ),
    },
  ];

  // ── Loading / Empty ──
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Contratos" description="Gestão de contratos de venda." breadcrumb={["Interno", "Cadastros", "Contratos"]} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-24 animate-pulse" />
          ))}
        </div>
        <div className="glass-card h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Contratos"
        description="Gestão de contratos de venda, financiamento e entrega."
        breadcrumb={["Interno", "Cadastros", "Contratos"]}
        actions={
          canWrite ? (
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Novo Contrato
            </Button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} />
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nº contrato, unidade, cliente..." className="w-full sm:max-w-xs" />
        {isPlatformAdmin && orgOptions.length > 1 && (
          <ChipFilter options={orgOptions} selected={orgFilter} onChange={setOrgFilter} />
        )}
        <ChipFilter options={devOptions} selected={devFilter} onChange={setDevFilter} />
        <ChipFilter options={CONTRACT_STATUSES} selected={statusFilter} onChange={setStatusFilter} />
        <ChipFilter options={FINANCING_STATUSES} selected={finStatusFilter} onChange={setFinStatusFilter} />
      </div>

      {/* Table */}
      {filtered.length === 0 && contracts.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Nenhum contrato cadastrado"
          description="Crie o primeiro contrato de venda para começar a acompanhar a carteira."
          action={canWrite ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Novo Contrato</Button> : undefined}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileSignature} title="Nenhum contrato encontrado" description="Tente ajustar os filtros ou a busca." />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} compact />
        </motion.div>
      )}

      {/* Drawer */}
      <DrawerShell
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? "Editar Contrato" : "Novo Contrato"}
        description={editing ? `Editando contrato ${editing.contract_number}` : "Preencha os dados do contrato de venda."}
      >
        <div className="space-y-4 p-1">
          {/* Organization */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Organização *</Label>
            <Select value={form.organization_id} onValueChange={(v) => setForm({ ...form, organization_id: v, unit_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.organization_id && <p className="text-xs text-destructive">{formErrors.organization_id}</p>}
          </div>

          {/* Unit */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Unidade *</Label>
            <Select value={form.unit_id} onValueChange={(v) => {
              const orgId = getOrgIdForUnit(v);
              setForm({ ...form, unit_id: v, organization_id: orgId || form.organization_id });
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {unitsForForm.map((u) => {
                  const block = blockMap.get(u.block_id);
                  const dev = block ? devMap.get(block.dev_id) : undefined;
                  return (
                    <SelectItem key={u.id} value={u.id}>
                      {u.code} — {block?.name ?? ""} — {dev?.name ?? ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {formErrors.unit_id && <p className="text-xs text-destructive">{formErrors.unit_id}</p>}
          </div>

          {/* Contract number */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Nº Contrato *</Label>
            <Input value={form.contract_number} onChange={(e) => setForm({ ...form, contract_number: e.target.value })} placeholder="CTR-001" />
            {formErrors.contract_number && <p className="text-xs text-destructive">{formErrors.contract_number}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status do Contrato</Label>
            <Select value={form.contract_status} onValueChange={(v) => setForm({ ...form, contract_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Valor Total (R$) *</Label>
              <Input type="number" step="0.01" value={form.total_contract_value} onChange={(e) => setForm({ ...form, total_contract_value: e.target.value })} placeholder="500000.00" />
              {formErrors.total_contract_value && <p className="text-xs text-destructive">{formErrors.total_contract_value}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Entrada (R$)</Label>
              <Input type="number" step="0.01" value={form.down_payment_amount} onChange={(e) => setForm({ ...form, down_payment_amount: e.target.value })} placeholder="50000.00" />
              {formErrors.down_payment_amount && <p className="text-xs text-destructive">{formErrors.down_payment_amount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Valor Financiado (R$)</Label>
              <Input type="number" step="0.01" value={form.financed_amount} onChange={(e) => setForm({ ...form, financed_amount: e.target.value })} placeholder="450000.00" />
              {formErrors.financed_amount && <p className="text-xs text-destructive">{formErrors.financed_amount}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Banco</Label>
              <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Caixa, Itaú..." />
            </div>
          </div>

          {/* Financing status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status do Financiamento</Label>
            <Select value={form.financing_status} onValueChange={(v) => setForm({ ...form, financing_status: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {FINANCING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data de Assinatura</Label>
              <Input type="date" value={form.signed_at} onChange={(e) => setForm({ ...form, signed_at: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Previsão de Entrega</Label>
              <Input type="date" value={form.handover_forecast_at} onChange={(e) => setForm({ ...form, handover_forecast_at: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Data de Entrega Efetiva</Label>
            <Input type="date" value={form.handover_at} onChange={(e) => setForm({ ...form, handover_at: e.target.value })} />
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={closeDrawer}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : editing ? "Salvar Alterações" : "Criar Contrato"}
            </Button>
          </div>
        </div>
      </DrawerShell>
    </div>
  );
}
