import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  UserCog,
  Plus,
  Pencil,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type OrgMembership = Tables<"organization_memberships">;
type Profile = Tables<"profiles">;

const ROLES = [
  { value: "org_admin", label: "Administrador" },
  { value: "finance_agent", label: "Financeiro" },
  { value: "support_agent", label: "Suporte" },
  { value: "inspection_agent", label: "Vistoria" },
  { value: "document_agent", label: "Documentos" },
  { value: "executive_viewer", label: "Executivo" },
] as const;

const roleLabel: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

const roleVariant: Record<string, "success" | "info" | "warning" | "neutral" | "pending" | "error"> = {
  org_admin: "success",
  finance_agent: "info",
  support_agent: "warning",
  inspection_agent: "pending",
  document_agent: "neutral",
  executive_viewer: "info",
};

type MemberRow = {
  membership_id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  org_id: string;
  org_name: string;
  role: string;
  active: boolean;
  access_status: "ativo" | "inativo" | "sem_vinculo";
};

type FormData = {
  user_id: string;
  organization_id: string;
  role: string;
  active: boolean;
};

const emptyForm: FormData = {
  user_id: "",
  organization_id: "",
  role: "support_agent",
  active: true,
};

export default function InternoEquipe() {
  const { user, isPlatformAdmin, memberships: myMemberships } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const canWrite =
    isPlatformAdmin ||
    myMemberships.some((m) => m.role === "org_admin" && m.active);

  // ── Queries ──────────────────────────────────────────
  const { data: orgMemberships = [], isLoading } = useQuery({
    queryKey: ["interno-equipe-memberships"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrgMembership[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["interno-equipe-profiles"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
      return (data ?? []) as Pick<Profile, "id" | "full_name" | "email">[];
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

  // ── Lookups ──
  const profileMap = useMemo(() => {
    const m = new Map<string, { full_name: string; email: string | null }>();
    profiles.forEach((p) => m.set(p.id, { full_name: p.full_name, email: p.email }));
    return m;
  }, [profiles]);

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    organizations.forEach((o) => m.set(o.id, o.name));
    return m;
  }, [organizations]);

  // ── Enriched rows ──
  const rows: MemberRow[] = useMemo(() => {
    // Filter out 'customer' role memberships — this page is for internal staff
    return orgMemberships
      .filter((m) => m.role !== "customer")
      .map((m) => {
        const profile = profileMap.get(m.user_id);
        return {
          membership_id: m.id,
          user_id: m.user_id,
          full_name: profile?.full_name ?? "Perfil não encontrado",
          email: profile?.email ?? null,
          org_id: m.organization_id,
          org_name: orgMap.get(m.organization_id) ?? "—",
          role: m.role,
          active: m.active,
          access_status: m.active ? "ativo" : "inativo",
        };
      });
  }, [orgMemberships, profileMap, orgMap]);

  // ── Filtered ──
  const filtered = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          (r.email?.toLowerCase().includes(q) ?? false)
      );
    }
    if (orgFilter.length > 0)
      result = result.filter((r) => orgFilter.includes(r.org_id));
    if (roleFilter.length > 0)
      result = result.filter((r) => roleFilter.includes(r.role));
    return result;
  }, [rows, search, orgFilter, roleFilter]);

  // ── KPIs ──
  const kpis = [
    { title: "Total de Membros", value: rows.length, icon: Users },
    { title: "Ativos", value: rows.filter((r) => r.active).length, icon: CheckCircle2 },
    { title: "Inativos", value: rows.filter((r) => !r.active).length, icon: XCircle },
    { title: "Organizações", value: new Set(rows.map((r) => r.org_id)).size, icon: Shield },
  ];

  // ── Filter options ──
  const orgOptions: ChipFilterOption[] = organizations.map((o) => ({ label: o.name, value: o.id }));
  const roleOptions: ChipFilterOption[] = ROLES.map((r) => ({ label: r.label, value: r.value }));

  // ── Profiles available for linking (not yet members of selected org) ──
  const availableProfiles = useMemo(() => {
    if (!form.organization_id) return profiles;
    const existingUserIds = new Set(
      orgMemberships
        .filter((m) => m.organization_id === form.organization_id)
        .map((m) => m.user_id)
    );
    return profiles.filter((p) => !existingUserIds.has(p.id));
  }, [form.organization_id, profiles, orgMemberships]);

  // ── Drawer ──
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (row: MemberRow) => {
    setEditing(row);
    setForm({
      user_id: row.user_id,
      organization_id: row.org_id,
      role: row.role,
      active: row.active,
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
    if (!editing && !form.user_id) errors.user_id = "Selecione um usuário.";
    if (!form.organization_id) errors.organization_id = "Selecione uma organização.";
    if (!form.role) errors.role = "Selecione um papel.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) {
        const { error } = await supabase
          .from("organization_memberships")
          .update({ role: data.role as OrgMembership["role"], active: data.active })
          .eq("id", editing.membership_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("organization_memberships").insert({
          user_id: data.user_id,
          organization_id: data.organization_id,
          role: data.role as OrgMembership["role"],
          active: data.active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Membro atualizado." : "Membro adicionado.");
      queryClient.invalidateQueries({ queryKey: ["interno-equipe-memberships"] });
      closeDrawer();
    },
    onError: (err: Error) => {
      if (err.message?.includes("duplicate key") || err.message?.includes("unique")) {
        toast.error("Este usuário já possui um vínculo com este papel nesta organização.");
      } else {
        toast.error(err.message || "Erro ao salvar membro.");
      }
    },
  });

  const handleSave = () => {
    if (!validate()) return;
    saveMutation.mutate(form);
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("organization_memberships")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado.");
      queryClient.invalidateQueries({ queryKey: ["interno-equipe-memberships"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Table columns ──
  const columns: DataColumn<MemberRow>[] = [
    {
      key: "full_name",
      header: "Nome",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-medium text-foreground">{row.full_name}</span>
          {row.email && <p className="text-[11px] text-muted-foreground">{row.email}</p>}
        </div>
      ),
    },
    {
      key: "org_name",
      header: "Organização",
      sortable: true,
      render: (row) => <span className="text-sm">{row.org_name}</span>,
    },
    {
      key: "role",
      header: "Papel",
      render: (row) => (
        <StatusChip
          label={roleLabel[row.role] ?? row.role}
          variant={roleVariant[row.role] ?? "neutral"}
        />
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (row) =>
        row.active ? (
          <StatusChip label="Ativo" variant="success" />
        ) : (
          <StatusChip label="Inativo" variant="error" />
        ),
    },
    {
      key: "access",
      header: "Acesso Interno",
      render: (row) => {
        if (row.active) return <StatusChip label="Ativo" variant="success" dot />;
        return <StatusChip label="Pendente" variant="warning" dot />;
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (row) => (
        <div className="flex items-center gap-1">
          {canWrite && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              >
                <Pencil className="h-3 w-3" /> Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleActive.mutate({ id: row.membership_id, active: !row.active });
                }}
              >
                {row.active ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {row.active ? "Desativar" : "Ativar"}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // ── Loading ──
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Equipe" description="Gestão de membros internos." breadcrumb={["Interno", "Cadastros", "Equipe"]} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="glass-card h-24 animate-pulse" />)}
        </div>
        <div className="glass-card h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Equipe"
        description="Gerencie membros internos, papéis e acessos por organização."
        breadcrumb={["Interno", "Cadastros", "Equipe"]}
        actions={
          canWrite ? (
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Adicionar Membro
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
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou e-mail..." className="w-full sm:max-w-xs" />
        {isPlatformAdmin && orgOptions.length > 1 && (
          <ChipFilter options={orgOptions} selected={orgFilter} onChange={setOrgFilter} />
        )}
        <ChipFilter options={roleOptions} selected={roleFilter} onChange={setRoleFilter} />
      </div>

      {/* Table */}
      {filtered.length === 0 && rows.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Nenhum membro interno cadastrado"
          description="Adicione membros da equipe e defina seus papéis para cada organização."
          action={canWrite ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Adicionar Membro</Button> : undefined}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="Nenhum membro encontrado" description="Tente ajustar os filtros ou a busca." />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.membership_id} compact />
        </motion.div>
      )}

      {/* Drawer */}
      <DrawerShell open={drawerOpen} onClose={closeDrawer} title={editing ? "Editar Membro" : "Adicionar Membro"}>
        <div className="space-y-4 p-1">
          {/* Organization */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Organização *</Label>
            <Select
              value={form.organization_id}
              onValueChange={(v) => setForm({ ...form, organization_id: v, user_id: "" })}
              disabled={!!editing}
            >
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.organization_id && <p className="text-xs text-destructive">{formErrors.organization_id}</p>}
          </div>

          {/* User (only for create) */}
          {!editing && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Usuário *</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um perfil..." /></SelectTrigger>
                <SelectContent>
                  {availableProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name} {p.email ? `(${p.email})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.user_id && <p className="text-xs text-destructive">{formErrors.user_id}</p>}
              {form.organization_id && availableProfiles.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Todos os perfis já possuem vínculo com esta organização.
                </p>
              )}
            </div>
          )}

          {editing && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Usuário</Label>
              <p className="text-sm text-foreground">{editing.full_name} {editing.email ? `(${editing.email})` : ""}</p>
            </div>
          )}

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Papel *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.role && <p className="text-xs text-destructive">{formErrors.role}</p>}
          </div>

          {/* Active */}
          <div className="flex items-center justify-between py-2">
            <Label className="text-xs font-medium">Membro ativo</Label>
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
          </div>

        </div>
      </DrawerShell>
    </div>
  );
}
