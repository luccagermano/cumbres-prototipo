import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2, Layers, Home, Users, FileSignature, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, ExternalLink, Sparkles,
} from "lucide-react";

// ── Types ──
type StepKey = "dev" | "block" | "unit" | "customer" | "membership" | "contract" | "summary";

const STEPS: { key: StepKey; label: string; icon: typeof Building2 }[] = [
  { key: "dev", label: "Empreendimento", icon: Building2 },
  { key: "block", label: "Bloco", icon: Layers },
  { key: "unit", label: "Unidade", icon: Home },
  { key: "customer", label: "Cliente", icon: Users },
  { key: "membership", label: "Vínculo", icon: Users },
  { key: "contract", label: "Contrato", icon: FileSignature },
  { key: "summary", label: "Confirmação", icon: CheckCircle2 },
];

type WizardState = {
  org_id: string;
  dev_id: string;
  dev_name: string;
  block_id: string;
  block_name: string;
  unit_id: string;
  unit_code: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  membership_id: string;
  contract_id: string;
  contract_number: string;
  // create-new forms
  new_dev_name: string;
  new_dev_slug: string;
  new_block_name: string;
  new_unit_code: string;
  new_unit_floor: string;
  new_unit_typology: string;
  new_customer_name: string;
  new_customer_email: string;
  new_contract_number: string;
  new_contract_value: string;
};

const emptyState: WizardState = {
  org_id: "", dev_id: "", dev_name: "", block_id: "", block_name: "",
  unit_id: "", unit_code: "", customer_id: "", customer_name: "", customer_email: "",
  membership_id: "", contract_id: "", contract_number: "",
  new_dev_name: "", new_dev_slug: "", new_block_name: "", new_unit_code: "",
  new_unit_floor: "", new_unit_typology: "", new_customer_name: "", new_customer_email: "",
  new_contract_number: "", new_contract_value: "",
};

export default function InternoOnboardingCliente() {
  const { user, isPlatformAdmin, memberships } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const canWrite =
    isPlatformAdmin ||
    memberships.some((m) => m.role === "org_admin" && m.active);

  // Read-only users see a clear message
  if (!canWrite) {
    return (
      <div>
        <PageHeader
          title="Onboarding de Cliente"
          description="Assistente guiado para configurar o acesso completo de um cliente ao portal."
          breadcrumb={["Interno", "Cadastros", "Onboarding"]}
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate("/interno/cadastros")}>
              Voltar ao Hub
            </Button>
          }
        />
        <EmptyState
          icon={Users}
          title="Acesso restrito"
          description="Apenas administradores de organização podem executar o onboarding de clientes."
        />
      </div>
    );
  }
  const [mode, setMode] = useState<"select" | "create">("select");
  const [ws, setWs] = useState<WizardState>(emptyState);
  const [saving, setSaving] = useState(false);

  const update = (partial: Partial<WizardState>) => setWs((p) => ({ ...p, ...partial }));

  // ── Queries ──
  const { data: orgs = [] } = useQuery({
    queryKey: ["onb-orgs"], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").eq("active", true).order("name");
      return data ?? [];
    },
  });

  const { data: devs = [] } = useQuery({
    queryKey: ["onb-devs", ws.org_id], enabled: !!ws.org_id,
    queryFn: async () => {
      const { data } = await supabase.from("developments").select("id, name, slug").eq("organization_id", ws.org_id).order("name");
      return data ?? [];
    },
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["onb-blocks", ws.dev_id], enabled: !!ws.dev_id,
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("id, name").eq("development_id", ws.dev_id).order("sort_order");
      return data ?? [];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["onb-units", ws.block_id], enabled: !!ws.block_id,
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id, code, floor_label, commercial_status").eq("block_id", ws.block_id).order("code");
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["onb-profiles"], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name").limit(500);
      return data ?? [];
    },
  });

  const { data: existingMemberships = [] } = useQuery({
    queryKey: ["onb-memberships", ws.unit_id], enabled: !!ws.unit_id,
    queryFn: async () => {
      const { data } = await supabase.from("unit_memberships").select("id, user_id, active, is_primary").eq("unit_id", ws.unit_id).eq("active", true);
      return data ?? [];
    },
  });

  const { data: existingContracts = [] } = useQuery({
    queryKey: ["onb-contracts", ws.unit_id], enabled: !!ws.unit_id,
    queryFn: async () => {
      const { data } = await supabase.from("sales_contracts").select("id, contract_number, contract_status, total_contract_value").eq("unit_id", ws.unit_id);
      return data ?? [];
    },
  });

  const orgName = orgs.find((o) => o.id === ws.org_id)?.name ?? "";

  // ── Step validation ──
  const canAdvance = (): boolean => {
    const s = STEPS[step].key;
    if (s === "dev") {
      if (!ws.org_id) return false;
      return mode === "create" ? !!(ws.new_dev_name.trim() && ws.new_dev_slug.trim()) : !!ws.dev_id;
    }
    if (s === "block") return mode === "create" ? !!ws.new_block_name.trim() : !!ws.block_id;
    if (s === "unit") return mode === "create" ? !!ws.new_unit_code.trim() : !!ws.unit_id;
    if (s === "customer") return mode === "create" ? !!(ws.new_customer_name.trim() && ws.new_customer_email.trim()) : !!ws.customer_id;
    if (s === "membership") return !!ws.customer_id && !!ws.unit_id;
    if (s === "contract") {
      if (ws.contract_id) return true;
      return !!(ws.new_contract_number.trim() && ws.new_contract_value.trim() && parseFloat(ws.new_contract_value) > 0);
    }
    return true;
  };

  // ── Step execution (create if needed, then advance) ──
  const handleNext = async () => {
    const s = STEPS[step].key;
    setSaving(true);
    try {
      if (s === "dev" && mode === "create") {
        const { data, error } = await supabase.from("developments").insert({
          name: ws.new_dev_name.trim(),
          slug: ws.new_dev_slug.trim().toLowerCase().replace(/\s+/g, "-"),
          organization_id: ws.org_id,
        }).select("id, name").single();
        if (error) throw error;
        update({ dev_id: data.id, dev_name: data.name, new_dev_name: "", new_dev_slug: "" });
        toast.success("Empreendimento criado.");
      } else if (s === "dev" && mode === "select") {
        const d = devs.find((x) => x.id === ws.dev_id);
        update({ dev_name: d?.name ?? "" });
      }

      if (s === "block" && mode === "create") {
        const { data, error } = await supabase.from("blocks").insert({
          name: ws.new_block_name.trim(),
          development_id: ws.dev_id,
        }).select("id, name").single();
        if (error) throw error;
        update({ block_id: data.id, block_name: data.name, new_block_name: "" });
        toast.success("Bloco criado.");
      } else if (s === "block" && mode === "select") {
        const b = blocks.find((x) => x.id === ws.block_id);
        update({ block_name: b?.name ?? "" });
      }

      if (s === "unit" && mode === "create") {
        const { data, error } = await supabase.from("units").insert({
          code: ws.new_unit_code.trim(),
          block_id: ws.block_id,
          floor_label: ws.new_unit_floor.trim() || null,
          typology: ws.new_unit_typology.trim() || null,
          commercial_status: "available",
        }).select("id, code").single();
        if (error) throw error;
        update({ unit_id: data.id, unit_code: data.code, new_unit_code: "", new_unit_floor: "", new_unit_typology: "" });
        toast.success("Unidade criada.");
      } else if (s === "unit" && mode === "select") {
        const u = units.find((x) => x.id === ws.unit_id);
        update({ unit_code: u?.code ?? "" });
      }

      if (s === "customer" && mode === "create") {
        // We need to create a profile via auth signup — but for admin flows we just need an existing profile
        // Instead, inform the user they must register first or use an existing profile
        toast.error("Para criar um novo cliente, cadastre-o primeiro via registro e depois selecione-o aqui.");
        setSaving(false);
        return;
      } else if (s === "customer" && mode === "select") {
        const p = profiles.find((x) => x.id === ws.customer_id);
        update({ customer_name: p?.full_name ?? "", customer_email: p?.email ?? "" });
      }

      if (s === "membership") {
        const existing = existingMemberships.find((m) => m.user_id === ws.customer_id);
        if (existing) {
          update({ membership_id: existing.id });
          toast.info("Cliente já vinculado a esta unidade.");
        } else {
          const { data, error } = await supabase.from("unit_memberships").insert({
            user_id: ws.customer_id,
            unit_id: ws.unit_id,
            membership_type: "owner",
            is_primary: true,
            active: true,
          }).select("id").single();
          if (error) throw error;
          update({ membership_id: data.id });
          toast.success("Cliente vinculado à unidade.");
        }
        queryClient.invalidateQueries({ queryKey: ["onb-memberships"] });
      }

      if (s === "contract") {
        if (ws.contract_id) {
          // Using existing
          const c = existingContracts.find((x) => x.id === ws.contract_id);
          update({ contract_number: c?.contract_number ?? "" });
        } else {
          const { data, error } = await supabase.from("sales_contracts").insert({
            contract_number: ws.new_contract_number.trim(),
            unit_id: ws.unit_id,
            organization_id: ws.org_id,
            total_contract_value: parseFloat(ws.new_contract_value),
            contract_status: "active",
          }).select("id, contract_number").single();
          if (error) throw error;
          update({ contract_id: data.id, contract_number: data.contract_number, new_contract_number: "", new_contract_value: "" });
          toast.success("Contrato criado.");
        }
        queryClient.invalidateQueries({ queryKey: ["onb-contracts"] });
      }

      setMode("select");
      setStep((p) => Math.min(p + 1, STEPS.length - 1));
    } catch (err: any) {
      const msg = err?.message ?? "Erro ao processar.";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        toast.error("Registro duplicado. Verifique os dados.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setMode("select");
    setStep((p) => Math.max(p - 1, 0));
  };

  const currentStep = STEPS[step];

  // ── Summary readiness ──
  const summaryItems = [
    { label: "Organização", value: orgName, ok: !!ws.org_id },
    { label: "Empreendimento", value: ws.dev_name, ok: !!ws.dev_id },
    { label: "Bloco", value: ws.block_name, ok: !!ws.block_id },
    { label: "Unidade", value: ws.unit_code, ok: !!ws.unit_id },
    { label: "Cliente", value: ws.customer_name, ok: !!ws.customer_id },
    { label: "Vínculo", value: ws.membership_id ? "Ativo" : "Pendente", ok: !!ws.membership_id },
    { label: "Contrato", value: ws.contract_number, ok: !!ws.contract_id },
  ];
  const allReady = summaryItems.every((s) => s.ok);

  return (
    <div>
      <PageHeader
        title="Onboarding de Cliente"
        description="Assistente guiado para configurar o acesso completo de um cliente ao portal."
        breadcrumb={["Interno", "Cadastros", "Onboarding"]}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/interno/cadastros")}>
            Voltar ao Hub
          </Button>
        }
      />

      {/* ── Progress bar ── */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.key} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  active ? "bg-primary/10 text-primary" : done ? "text-primary/70" : "text-muted-foreground"
                }`}>
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden md:inline">{s.label}</span>
                  <span className="md:hidden">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 ${done ? "bg-primary/40" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="glass-card p-6"
        >
          <div className="mb-5">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              {(() => { const Icon = currentStep.icon; return <Icon className="h-5 w-5 text-primary" />; })()}
              Passo {step + 1}: {currentStep.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStep.key === "dev" && "Selecione a organização e o empreendimento para este cliente."}
              {currentStep.key === "block" && `Selecione ou crie o bloco dentro de "${ws.dev_name}".`}
              {currentStep.key === "unit" && `Selecione ou crie a unidade dentro do bloco "${ws.block_name}".`}
              {currentStep.key === "customer" && "Selecione o perfil do cliente que receberá acesso."}
              {currentStep.key === "membership" && `Vincule "${ws.customer_name}" à unidade ${ws.unit_code}.`}
              {currentStep.key === "contract" && `Crie ou selecione o contrato para a unidade ${ws.unit_code}.`}
              {currentStep.key === "summary" && "Revise todos os dados e confirme a prontidão do acesso."}
            </p>
          </div>

          {/* ── STEP: Dev ── */}
          {currentStep.key === "dev" && (
            <div className="space-y-4 max-w-lg">
              <div>
                <Label className="text-xs font-medium">Organização *</Label>
                <Select value={ws.org_id} onValueChange={(v) => update({ org_id: v, dev_id: "", dev_name: "", block_id: "", block_name: "", unit_id: "", unit_code: "" })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a organização..." /></SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {ws.org_id && (
                <>
                  <div className="flex items-center gap-2">
                    <Button variant={mode === "select" ? "default" : "outline"} size="sm" onClick={() => setMode("select")}>Selecionar existente</Button>
                    <Button variant={mode === "create" ? "default" : "outline"} size="sm" onClick={() => setMode("create")}>Criar novo</Button>
                  </div>
                  {mode === "select" ? (
                    <div>
                      <Label className="text-xs font-medium">Empreendimento *</Label>
                      <Select value={ws.dev_id} onValueChange={(v) => update({ dev_id: v, block_id: "", block_name: "", unit_id: "", unit_code: "" })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {devs.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {devs.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-2">Nenhum empreendimento nesta organização. Crie um novo.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium">Nome do Empreendimento *</Label>
                        <Input className="mt-1" value={ws.new_dev_name} onChange={(e) => update({ new_dev_name: e.target.value, new_dev_slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} placeholder="Residencial Aurora" maxLength={100} />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Slug (URL) *</Label>
                        <Input className="mt-1" value={ws.new_dev_slug} onChange={(e) => update({ new_dev_slug: e.target.value })} placeholder="residencial-aurora" maxLength={100} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── STEP: Block ── */}
          {currentStep.key === "block" && (
            <div className="space-y-4 max-w-lg">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {ws.dev_name}
              </div>
              <div className="flex items-center gap-2">
                <Button variant={mode === "select" ? "default" : "outline"} size="sm" onClick={() => setMode("select")}>Selecionar existente</Button>
                <Button variant={mode === "create" ? "default" : "outline"} size="sm" onClick={() => setMode("create")}>Criar novo</Button>
              </div>
              {mode === "select" ? (
                <div>
                  <Label className="text-xs font-medium">Bloco / Torre *</Label>
                  <Select value={ws.block_id} onValueChange={(v) => update({ block_id: v, unit_id: "", unit_code: "" })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {blocks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {blocks.length === 0 && <p className="text-xs text-muted-foreground mt-2">Nenhum bloco neste empreendimento. Crie um novo.</p>}
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-medium">Nome do Bloco *</Label>
                  <Input className="mt-1" value={ws.new_block_name} onChange={(e) => update({ new_block_name: e.target.value })} placeholder="Torre A" maxLength={50} />
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Unit ── */}
          {currentStep.key === "unit" && (
            <div className="space-y-4 max-w-lg">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {ws.dev_name} › {ws.block_name}
              </div>
              <div className="flex items-center gap-2">
                <Button variant={mode === "select" ? "default" : "outline"} size="sm" onClick={() => setMode("select")}>Selecionar existente</Button>
                <Button variant={mode === "create" ? "default" : "outline"} size="sm" onClick={() => setMode("create")}>Criar nova</Button>
              </div>
              {mode === "select" ? (
                <div>
                  <Label className="text-xs font-medium">Unidade *</Label>
                  <Select value={ws.unit_id} onValueChange={(v) => update({ unit_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.code} {u.floor_label ? `(${u.floor_label})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {units.length === 0 && <p className="text-xs text-muted-foreground mt-2">Nenhuma unidade neste bloco. Crie uma nova.</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Código *</Label>
                      <Input className="mt-1" value={ws.new_unit_code} onChange={(e) => update({ new_unit_code: e.target.value })} placeholder="101" maxLength={20} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Andar</Label>
                      <Input className="mt-1" value={ws.new_unit_floor} onChange={(e) => update({ new_unit_floor: e.target.value })} placeholder="1º andar" maxLength={20} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Tipologia</Label>
                    <Input className="mt-1" value={ws.new_unit_typology} onChange={(e) => update({ new_unit_typology: e.target.value })} placeholder="2 quartos" maxLength={50} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Customer ── */}
          {currentStep.key === "customer" && (
            <div className="space-y-4 max-w-lg">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Home className="h-3 w-3" /> {ws.dev_name} › {ws.block_name} › {ws.unit_code}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione um perfil já cadastrado na plataforma. O cliente precisa ter uma conta registrada.
              </p>
              <div>
                <Label className="text-xs font-medium">Cliente *</Label>
                <Select value={ws.customer_id} onValueChange={(v) => update({ customer_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Buscar por nome..." /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name} {p.email ? `(${p.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {profiles.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum perfil encontrado. O cliente precisa se registrar na plataforma primeiro.</p>
              )}
            </div>
          )}

          {/* ── STEP: Membership ── */}
          {currentStep.key === "membership" && (
            <div className="space-y-4 max-w-lg">
              <div className="text-xs text-muted-foreground">
                {ws.customer_name} será vinculado como proprietário principal da unidade {ws.unit_code}.
              </div>
              {existingMemberships.find((m) => m.user_id === ws.customer_id) ? (
                <div className="glass-card p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Vínculo já existe</p>
                    <p className="text-xs text-muted-foreground">Este cliente já está vinculado a esta unidade. O passo será pulado automaticamente.</p>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-4 flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Novo vínculo será criado</p>
                    <p className="text-xs text-muted-foreground">O cliente será adicionado como proprietário principal com acesso ativo ao portal.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Contract ── */}
          {currentStep.key === "contract" && (
            <div className="space-y-4 max-w-lg">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Home className="h-3 w-3" /> {ws.unit_code} · {ws.customer_name}
              </div>
              {existingContracts.length > 0 && (
                <div>
                  <Label className="text-xs font-medium">Contrato existente</Label>
                  <Select value={ws.contract_id} onValueChange={(v) => update({ contract_id: v, new_contract_number: "", new_contract_value: "" })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione ou crie abaixo..." /></SelectTrigger>
                    <SelectContent>
                      {existingContracts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.contract_number} — {c.contract_status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!ws.contract_id && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground">
                    {existingContracts.length > 0 ? "Ou criar novo contrato:" : "Criar contrato:"}
                  </p>
                  <div>
                    <Label className="text-xs font-medium">Número do Contrato *</Label>
                    <Input className="mt-1" value={ws.new_contract_number} onChange={(e) => update({ new_contract_number: e.target.value })} placeholder="CT-2026-001" maxLength={50} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Valor Total (R$) *</Label>
                    <Input className="mt-1" type="number" min="0" step="0.01" value={ws.new_contract_value} onChange={(e) => update({ new_contract_value: e.target.value })} placeholder="350000.00" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Summary ── */}
          {currentStep.key === "summary" && (
            <div className="space-y-5 max-w-lg">
              <div className="space-y-2">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.value || "—"}</span>
                      <StatusChip
                        variant={item.ok ? "success" : "warning"}
                        label={item.ok ? "OK" : "Pendente"}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {allReady ? (
                <div className="glass-card p-4 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Acesso pronto!</p>
                      <p className="text-xs text-muted-foreground">O cliente {ws.customer_name} já pode acessar o portal da unidade {ws.unit_code}.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-4 border-amber-200/40 bg-amber-50/30">
                  <p className="text-sm text-amber-700 font-medium">Há itens pendentes. Revise os passos anteriores.</p>
                </div>
              )}

              {allReady && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/interno/cadastros/clientes")}>
                    <Users className="h-3.5 w-3.5" /> Abrir Clientes
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/interno/cadastros/unidades?block=${ws.block_id}`)}>
                    <Home className="h-3.5 w-3.5" /> Abrir Unidade
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/interno/cadastros/contratos`)}>
                    <FileSignature className="h-3.5 w-3.5" /> Abrir Contratos
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/cliente")}>
                    <ExternalLink className="h-3.5 w-3.5" /> Portal do Cliente
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={step === 0 || saving}
              className="gap-1.5"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </Button>
            {currentStep.key !== "summary" ? (
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canAdvance() || saving}
                className="gap-1.5"
              >
                {saving ? "Salvando..." : "Próximo"} <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setWs(emptyState);
                  setStep(0);
                  toast.success("Onboarding finalizado. Você pode iniciar outro.");
                }}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" /> Novo Onboarding
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}