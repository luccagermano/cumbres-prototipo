import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, DataColumn } from "@/components/ui/data-table";
import { SearchBar } from "@/components/ui/search-bar";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/EmptyState";
import { DrawerShell } from "@/components/ui/modal-shell";
import { ModalShell } from "@/components/ui/modal-shell";
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
import {
  Users,
  Plus,
  Pencil,
  Home,
  Link2,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type UnitMembership = Tables<"unit_memberships">;

type MembershipEnriched = UnitMembership & {
  unit_code: string;
  block_name: string;
  dev_name: string;
};

type CustomerRow = Profile & {
  memberships: MembershipEnriched[];
  unit_count: number;
  has_active: boolean;
  portal_status: "ready" | "pending" | "incomplete" | "sem_vinculo";
};

type ProfileFormData = {
  full_name: string;
  email: string;
  phone_e164: string;
  cpf_last4: string;
};

type LinkFormData = {
  user_id: string;
  unit_id: string;
  membership_type: string;
  is_primary: boolean;
  purchased_at: string;
};

const emptyProfileForm: ProfileFormData = {
  full_name: "",
  email: "",
  phone_e164: "",
  cpf_last4: "",
};

const emptyLinkForm: LinkFormData = {
  user_id: "",
  unit_id: "",
  membership_type: "owner",
  is_primary: true,
  purchased_at: "",
};

const portalChip: Record<string, { variant: "success" | "warning" | "pending" | "neutral"; label: string }> = {
  ready: { variant: "success", label: "Pronto" },
  pending: { variant: "warning", label: "Pendente" },
  incomplete: { variant: "pending", label: "Incompleto" },
  sem_vinculo: { variant: "neutral", label: "Sem vínculo" },
};

export default function InternoClientes() {
  const { user, isPlatformAdmin, memberships: myMemberships } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  // Profile drawer
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormData>(emptyProfileForm);
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  // Link modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState<LinkFormData>(emptyLinkForm);
  const [linkErrors, setLinkErrors] = useState<Partial<Record<keyof LinkFormData, string>>>({});

  // Detail drawer
  const [detailCustomer, setDetailCustomer] = useState<CustomerRow | null>(null);

  const canWrite = isPlatformAdmin || myMemberships.some((m) => m.role === "org_admin" && m.active);

  // ── Queries ──
  const { data: memberships = [], isLoading: loadMemberships } = useQuery({
    queryKey: ["interno-unit-memberships"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("unit_memberships").select("*");
      if (error) throw error;
      return data as UnitMembership[];
    },
  });

  const { data: profiles = [], isLoading: loadProfiles } = useQuery({
    queryKey: ["interno-customer-profiles"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["interno-units-lookup-clientes"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id, code, block_id").order("code");
      return (data ?? []) as { id: string; code: string; block_id: string }[];
    },
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["interno-blocks-lookup-clientes"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("id, name, development_id").order("name");
      return (data ?? []) as { id: string; name: string; development_id: string }[];
    },
  });

  const { data: developments = [] } = useQuery({
    queryKey: ["interno-devs-lookup-clientes"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("developments").select("id, name, organization_id").order("name");
      return (data ?? []) as { id: string; name: string; organization_id: string }[];
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
    const m = new Map<string, string>();
    developments.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [developments]);

  // ── Enriched memberships ──
  const enrichedMemberships: MembershipEnriched[] = useMemo(() => {
    return memberships.map((m) => {
      const unit = unitMap.get(m.unit_id);
      const block = unit ? blockMap.get(unit.block_id) : undefined;
      const devName = block ? devMap.get(block.dev_id) ?? "—" : "—";
      return {
        ...m,
        unit_code: unit?.code ?? "—",
        block_name: block?.name ?? "—",
        dev_name: devName,
      };
    });
  }, [memberships, unitMap, blockMap, devMap]);

  // ── Group by user ──
  const membershipsByUser = useMemo(() => {
    const m = new Map<string, MembershipEnriched[]>();
    enrichedMemberships.forEach((em) => {
      const list = m.get(em.user_id) ?? [];
      list.push(em);
      m.set(em.user_id, list);
    });
    return m;
  }, [enrichedMemberships]);

  // ── Customer rows — show ALL profiles, not just those with memberships ──
  const customerRows: CustomerRow[] = useMemo(() => {
    return profiles.map((p) => {
      const ms = membershipsByUser.get(p.id) ?? [];
      const hasActive = ms.some((m) => m.active);
      const unitCount = ms.filter((m) => m.active).length;

      let portalStatus: "ready" | "pending" | "incomplete" | "sem_vinculo" = "sem_vinculo";
      if (unitCount === 0) {
        portalStatus = "sem_vinculo";
      } else if (hasActive && p.email) {
        portalStatus = "ready";
      } else if (hasActive || p.email) {
        portalStatus = "pending";
      } else {
        portalStatus = "incomplete";
      }

      return {
        ...p,
        memberships: ms,
        unit_count: unitCount,
        has_active: hasActive,
        portal_status: portalStatus,
      };
    });
  }, [profiles, membershipsByUser]);

  // ── Filters ──
  const filtered = useMemo(() => {
    if (!search) return customerRows;
    const q = search.toLowerCase();
    return customerRows.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone_e164?.includes(q) ||
        c.memberships.some((m) => m.unit_code.toLowerCase().includes(q))
    );
  }, [customerRows, search]);

  // ── KPIs ──
  const kpis = [
    { title: "Total de Perfis", value: customerRows.length, icon: Users },
    { title: "Prontos", value: customerRows.filter((c) => c.portal_status === "ready").length, icon: UserCheck },
    { title: "Sem Vínculo", value: customerRows.filter((c) => c.portal_status === "sem_vinculo").length, icon: UserX },
    { title: "Pendentes", value: customerRows.filter((c) => c.portal_status === "pending" || c.portal_status === "incomplete").length, icon: Clock },
  ];

  // ── Profile Mutations ──
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const payload = {
        full_name: data.full_name.trim(),
        email: data.email.trim() || null,
        phone_e164: data.phone_e164.trim() || null,
        cpf_last4: data.cpf_last4.trim() || null,
      };
      if (editingProfile) {
        const { error } = await supabase.from("profiles").update(payload).eq("id", editingProfile.id);
        if (error) throw error;
      }
      // Note: Creating new profiles requires creating auth user first
      // For editing existing profiles only
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["interno-customer-profiles"] });
      closeProfileDrawer();
    },
    onError: () => toast.error("Erro ao salvar perfil."),
  });

  const linkMutation = useMutation({
    mutationFn: async (data: LinkFormData) => {
      const { error } = await supabase.from("unit_memberships").insert({
        user_id: data.user_id,
        unit_id: data.unit_id,
        membership_type: data.membership_type,
        is_primary: data.is_primary,
        purchased_at: data.purchased_at || null,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Unidade vinculada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["interno-unit-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["cadastros-clients"] });
      setLinkModalOpen(false);
      setLinkForm(emptyLinkForm);
    },
    onError: (err: Error) => {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        toast.error("Este cliente já está vinculado a essa unidade.");
      } else {
        toast.error("Erro ao vincular unidade.");
      }
    },
  });

  const toggleMembershipMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("unit_memberships").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vínculo atualizado.");
      queryClient.invalidateQueries({ queryKey: ["interno-unit-memberships"] });
    },
    onError: () => toast.error("Erro ao atualizar vínculo."),
  });

  // ── Profile Drawer ──
  const openEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setProfileForm({
      full_name: profile.full_name,
      email: profile.email ?? "",
      phone_e164: profile.phone_e164 ?? "",
      cpf_last4: profile.cpf_last4 ?? "",
    });
    setProfileErrors({});
    setProfileDrawerOpen(true);
  };

  const closeProfileDrawer = () => {
    setProfileDrawerOpen(false);
    setEditingProfile(null);
    setProfileForm(emptyProfileForm);
    setProfileErrors({});
  };

  const validateProfile = (): boolean => {
    const errors: Partial<Record<keyof ProfileFormData, string>> = {};
    if (!profileForm.full_name.trim()) errors.full_name = "Nome é obrigatório.";
    if (profileForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim()))
      errors.email = "E-mail inválido.";
    if (profileForm.cpf_last4 && !/^\d{4}$/.test(profileForm.cpf_last4.trim()))
      errors.cpf_last4 = "Informe os 4 últimos dígitos.";
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = () => {
    if (!validateProfile()) return;
    profileMutation.mutate(profileForm);
  };

  const updateProfileField = (key: keyof ProfileFormData, value: string) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
    if (profileErrors[key]) setProfileErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ── Link Modal ──
  const openLinkModal = (userId: string) => {
    setLinkForm({ ...emptyLinkForm, user_id: userId });
    setLinkErrors({});
    setLinkModalOpen(true);
  };

  const validateLink = (): boolean => {
    const errors: Partial<Record<keyof LinkFormData, string>> = {};
    if (!linkForm.unit_id) errors.unit_id = "Selecione uma unidade.";
    setLinkErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLinkSubmit = () => {
    if (!validateLink()) return;
    linkMutation.mutate(linkForm);
  };

  // ── Unit select options with context ──
  const unitOptions = useMemo(() => {
    return units.map((u) => {
      const block = blockMap.get(u.block_id);
      const devName = block ? devMap.get(block.dev_id) ?? "" : "";
      return {
        id: u.id,
        label: `${u.code} — ${block?.name ?? ""} — ${devName}`,
      };
    });
  }, [units, blockMap, devMap]);

  // ── Columns ──
  const columns: DataColumn<CustomerRow>[] = [
    {
      key: "full_name",
      header: "Nome",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{row.full_name}</p>
          {row.email && <p className="text-[11px] text-muted-foreground truncate">{row.email}</p>}
        </div>
      ),
    },
    {
      key: "phone_e164",
      header: "Telefone",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.phone_e164 ?? "—"}</span>
      ),
    },
    {
      key: "unit_count",
      header: "Unidades",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Home className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{row.unit_count}</span>
          {row.memberships.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              ({row.memberships.filter((m) => m.is_primary)[0]?.unit_code ?? row.memberships[0]?.unit_code})
            </span>
          )}
          {row.unit_count === 0 && (
            <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
              <AlertCircle className="h-2.5 w-2.5" /> Sem unidade
            </span>
          )}
        </div>
      ),
    },
    {
      key: "membership_type",
      header: "Vínculo",
      render: (row) => {
        const primary = row.memberships.find((m) => m.is_primary) ?? row.memberships[0];
        if (!primary) return <span className="text-xs text-muted-foreground">—</span>;
        const typeLabel: Record<string, string> = { owner: "Proprietário", tenant: "Inquilino", resident: "Morador" };
        return (
          <div>
            <span className="text-xs text-foreground">{typeLabel[primary.membership_type] ?? primary.membership_type}</span>
            <p className="text-[10px] text-muted-foreground">{primary.dev_name} › {primary.block_name} › {primary.unit_code}</p>
          </div>
        );
      },
    },
    {
      key: "portal_status",
      header: "Portal",
      render: (row) => {
        const chip = portalChip[row.portal_status];
        return <StatusChip variant={chip.variant} label={chip.label} />;
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-[240px]",
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          {canWrite && (
            <>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); openEditProfile(row); }}>
                <Pencil className="h-3 w-3" /> Editar
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); openLinkModal(row.id); }}>
                <Link2 className="h-3 w-3" /> Vincular
              </Button>
            </>
          )}
          {row.unit_count > 0 && (
            <Link to="/interno/cadastros/unidades" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Home className="h-3 w-3" /> Unidade
              </Button>
            </Link>
          )}
        </div>
      ),
    },
  ];

  const isLoading = loadProfiles || loadMemberships;

  // ── Render ──
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Clientes" breadcrumb={["Interno", "Cadastros", "Clientes"]} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="glass-card p-5 h-24 animate-pulse" />)}
        </div>
        <div className="glass-card h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gestão de clientes vinculados a unidades da plataforma."
        breadcrumb={["Interno", "Cadastros", "Clientes"]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} />
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar placeholder="Buscar por nome, e-mail, telefone ou unidade..." value={search} onChange={setSearch} className="max-w-lg" />
      </div>

      {/* Table or Empty */}
      {customerRows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum perfil encontrado"
          description="Nenhum perfil de usuário foi retornado. Verifique se existem usuários cadastrados e se suas permissões de acesso estão configuradas corretamente."
        />
          icon={Users}
          title="Nenhum cliente vinculado"
          description="Vincule clientes a unidades para que eles possam acessar o portal do cliente."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          compact
          onRowClick={(row) => setDetailCustomer(row)}
          emptyMessage="Nenhum cliente encontrado com os filtros aplicados."
        />
      )}

      {/* Detail Drawer */}
      <DrawerShell
        open={!!detailCustomer}
        onClose={() => setDetailCustomer(null)}
        title={detailCustomer?.full_name ?? "Cliente"}
      >
        {detailCustomer && (
          <div className="space-y-5">
            {/* Profile info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados do Perfil</span>
                {canWrite && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setDetailCustomer(null); openEditProfile(detailCustomer); }}>
                    <Pencil className="h-3 w-3" /> Editar
                  </Button>
                )}
              </div>
              <div className="glass-card p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium text-foreground">{detailCustomer.full_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">E-mail</span><span className="text-foreground">{detailCustomer.email ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span className="text-foreground">{detailCustomer.phone_e164 ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CPF (últimos 4)</span><span className="text-foreground">{detailCustomer.cpf_last4 ?? "—"}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Portal</span>
                  <StatusChip variant={portalChip[detailCustomer.portal_status].variant} label={portalChip[detailCustomer.portal_status].label} />
                </div>
              </div>
            </div>

            {/* Memberships */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unidades Vinculadas</span>
                {canWrite && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setDetailCustomer(null); openLinkModal(detailCustomer.id); }}>
                    <Plus className="h-3 w-3" /> Vincular
                  </Button>
                )}
              </div>
              {detailCustomer.memberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma unidade vinculada.</p>
              ) : (
                <div className="space-y-2">
                  {detailCustomer.memberships.map((m) => {
                    const typeLabel: Record<string, string> = { owner: "Proprietário", tenant: "Inquilino", resident: "Morador" };
                    return (
                      <div key={m.id} className="glass-card p-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <Home className="h-3.5 w-3.5 text-primary" />
                            {m.unit_code}
                            {m.is_primary && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Principal</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{m.dev_name} › {m.block_name}</p>
                          <p className="text-[11px] text-muted-foreground">{typeLabel[m.membership_type] ?? m.membership_type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusChip variant={m.active ? "success" : "neutral"} label={m.active ? "Ativo" : "Inativo"} />
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => toggleMembershipMutation.mutate({ id: m.id, active: !m.active })}
                            >
                              {m.active ? "Desativar" : "Ativar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DrawerShell>

      {/* Profile Edit Drawer */}
      <DrawerShell
        open={profileDrawerOpen}
        onClose={closeProfileDrawer}
        title="Editar Perfil do Cliente"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeProfileDrawer}>Cancelar</Button>
            <Button size="sm" onClick={handleProfileSubmit} disabled={profileMutation.isPending}>
              {profileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Nome completo *</Label>
            <Input className="mt-1" value={profileForm.full_name} onChange={(e) => updateProfileField("full_name", e.target.value)} placeholder="João da Silva" maxLength={100} />
            {profileErrors.full_name && <p className="text-[11px] text-destructive mt-1">{profileErrors.full_name}</p>}
          </div>
          <div>
            <Label className="text-xs font-medium">E-mail</Label>
            <Input className="mt-1" type="email" value={profileForm.email} onChange={(e) => updateProfileField("email", e.target.value)} placeholder="joao@email.com" maxLength={255} />
            {profileErrors.email && <p className="text-[11px] text-destructive mt-1">{profileErrors.email}</p>}
          </div>
          <div>
            <Label className="text-xs font-medium">Telefone</Label>
            <Input className="mt-1" value={profileForm.phone_e164} onChange={(e) => updateProfileField("phone_e164", e.target.value)} placeholder="+5511999887766" maxLength={20} />
          </div>
          <div>
            <Label className="text-xs font-medium">CPF (últimos 4 dígitos)</Label>
            <Input className="mt-1" value={profileForm.cpf_last4} onChange={(e) => updateProfileField("cpf_last4", e.target.value)} placeholder="1234" maxLength={4} />
            {profileErrors.cpf_last4 && <p className="text-[11px] text-destructive mt-1">{profileErrors.cpf_last4}</p>}
          </div>
        </div>
      </DrawerShell>

      {/* Link Unit Modal */}
      <ModalShell
        open={linkModalOpen}
        onClose={() => { setLinkModalOpen(false); setLinkForm(emptyLinkForm); }}
        title="Vincular Unidade ao Cliente"
        description="Selecione a unidade e o tipo de vínculo."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => { setLinkModalOpen(false); setLinkForm(emptyLinkForm); }}>Cancelar</Button>
            <Button size="sm" onClick={handleLinkSubmit} disabled={linkMutation.isPending}>
              {linkMutation.isPending ? "Vinculando..." : "Vincular"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Unidade *</Label>
            <Select value={linkForm.unit_id} onValueChange={(v) => { setLinkForm((p) => ({ ...p, unit_id: v })); setLinkErrors({}); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a unidade..." /></SelectTrigger>
              <SelectContent>
                {unitOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkErrors.unit_id && <p className="text-[11px] text-destructive mt-1">{linkErrors.unit_id}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Tipo de vínculo</Label>
              <Select value={linkForm.membership_type} onValueChange={(v) => setLinkForm((p) => ({ ...p, membership_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Proprietário</SelectItem>
                  <SelectItem value="tenant">Inquilino</SelectItem>
                  <SelectItem value="resident">Morador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Data de compra</Label>
              <Input className="mt-1" type="date" value={linkForm.purchased_at} onChange={(e) => setLinkForm((p) => ({ ...p, purchased_at: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_primary"
              checked={linkForm.is_primary}
              onChange={(e) => setLinkForm((p) => ({ ...p, is_primary: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <Label htmlFor="is_primary" className="text-xs font-medium cursor-pointer">Definir como unidade principal</Label>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
