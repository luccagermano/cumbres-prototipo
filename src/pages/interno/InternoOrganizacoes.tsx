import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Building2, Plus, Pencil, CheckCircle2, XCircle, Upload, Image,
} from "lucide-react";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";

type Organization = {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  active: boolean;
  logo_path: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  created_at: string;
  updated_at: string;
};

type FormData = {
  name: string;
  slug: string;
  legal_name: string;
  active: boolean;
  brand_primary_color: string;
  brand_secondary_color: string;
};

const emptyForm: FormData = {
  name: "",
  slug: "",
  legal_name: "",
  active: true,
  brand_primary_color: "",
  brand_secondary_color: "",
};

export default function InternoOrganizacoes() {
  const { user, isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canWrite = isPlatformAdmin;

  // ── Queries ──
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["interno-organizacoes"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Organization[];
    },
  });

  // ── Derived ──
  const filtered = useMemo(() => {
    let list = organizations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.slug.toLowerCase().includes(q) ||
          (o.legal_name && o.legal_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [organizations, search]);

  const totalCount = organizations.length;
  const activeCount = organizations.filter((o) => o.active).length;
  const inactiveCount = totalCount - activeCount;

  // ── Logo helpers ──
  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null;
    const { data } = supabase.storage
      .from("organization-assets-private")
      .getPublicUrl(logoPath);
    return data?.publicUrl || null;
  };

  const getSignedLogoUrl = async (logoPath: string) => {
    const { data } = await supabase.storage
      .from("organization-assets-private")
      .createSignedUrl(logoPath, 3600);
    return data?.signedUrl || null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }
    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (orgId: string): Promise<string | null> => {
    if (!logoFile) return null;
    const ext = logoFile.name.split(".").pop() || "png";
    const path = `${orgId}/logo.${ext}`;

    const { error } = await supabase.storage
      .from("organization-assets-private")
      .upload(path, logoFile, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload da logomarca.");
      return null;
    }
    return path;
  };

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);

      if (editing) {
        // Upload logo if changed
        let logoPath = editing.logo_path;
        if (logoFile) {
          const uploaded = await uploadLogo(editing.id);
          if (uploaded) logoPath = uploaded;
        }

        const { error } = await supabase
          .from("organizations")
          .update({
            name: form.name,
            slug: form.slug,
            legal_name: form.legal_name || null,
            active: form.active,
            logo_path: logoPath,
            brand_primary_color: form.brand_primary_color || null,
            brand_secondary_color: form.brand_secondary_color || null,
          } as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        // Create
        const { data: newOrg, error } = await supabase
          .from("organizations")
          .insert({
            name: form.name,
            slug: form.slug,
            legal_name: form.legal_name || null,
            active: form.active,
            brand_primary_color: form.brand_primary_color || null,
            brand_secondary_color: form.brand_secondary_color || null,
          } as any)
          .select()
          .single();
        if (error) throw error;

        // Upload logo after creation
        if (logoFile && newOrg) {
          const uploaded = await uploadLogo(newOrg.id);
          if (uploaded) {
            await supabase
              .from("organizations")
              .update({ logo_path: uploaded } as any)
              .eq("id", newOrg.id);
          }
        }
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Organização atualizada." : "Organização criada.");
      queryClient.invalidateQueries({ queryKey: ["interno-organizacoes"] });
      queryClient.invalidateQueries({ queryKey: ["interno-organizations"] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar organização.");
    },
    onSettled: () => setUploading(false),
  });

  // ── Form ──
  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errors.name = "Nome é obrigatório";
    if (!form.slug.trim()) errors.slug = "Slug é obrigatório";
    else if (!/^[a-z0-9-]+$/.test(form.slug))
      errors.slug = "Slug deve conter apenas letras minúsculas, números e hífens";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    saveMutation.mutate();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setLogoFile(null);
    setLogoPreview(null);
    setDrawerOpen(true);
  };

  const openEdit = async (org: Organization) => {
    setEditing(org);
    setForm({
      name: org.name,
      slug: org.slug,
      legal_name: org.legal_name || "",
      active: org.active,
      brand_primary_color: org.brand_primary_color || "",
      brand_secondary_color: org.brand_secondary_color || "",
    });
    setFormErrors({});
    setLogoFile(null);

    if (org.logo_path) {
      const url = await getSignedLogoUrl(org.logo_path);
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }

    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setField("name", value);
    if (!editing) {
      setField(
        "slug",
        value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  // ── Columns ──
  const columns: DataColumn<Organization>[] = [
    {
      key: "logo",
      header: "",
      className: "w-10",
      render: (org) =>
        org.logo_path ? (
          <LogoThumb logoPath={org.logo_path} />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
    },
    {
      key: "name",
      header: "Nome",
      sortable: true,
      render: (org) => (
        <div>
          <p className="font-medium text-foreground text-sm">{org.name}</p>
          <p className="text-xs text-muted-foreground">{org.slug}</p>
        </div>
      ),
    },
    {
      key: "legal_name",
      header: "Razão Social",
      render: (org) => (
        <span className="text-sm text-muted-foreground">
          {org.legal_name || "—"}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (org) => (
        <StatusChip
          variant={org.active ? "success" : "neutral"}
          label={org.active ? "Ativa" : "Inativa"}
          size="sm"
        />
      ),
    },
    ...(canWrite
      ? [
          {
            key: "actions" as const,
            header: "",
            className: "w-10",
            render: (org: Organization) => (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(org);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            ),
          },
        ]
      : []),
  ];

  // ── Render ──
  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Organizações"
          description="Gestão de organizações da plataforma."
          breadcrumb={["Interno", "Cadastros", "Organizações"]}
        />
        <CardGridSkeleton count={3} />
      </div>
    );
  }

  const drawerFooter = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={closeDrawer} className="flex-1">
        Cancelar
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={saveMutation.isPending || uploading}
        className="flex-1"
      >
        {saveMutation.isPending || uploading
          ? "Salvando…"
          : editing
          ? "Atualizar"
          : "Criar"}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Organizações"
        description="Gerencie as organizações cadastradas na plataforma."
        breadcrumb={["Interno", "Cadastros", "Organizações"]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { title: "Total", value: totalCount, icon: Building2 },
          { title: "Ativas", value: activeCount, icon: CheckCircle2 },
          { title: "Inativas", value: inactiveCount, icon: XCircle },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <KpiCard title={kpi.title} value={kpi.value} icon={kpi.icon} />
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome ou slug…"
          className="flex-1"
        />
        {canWrite && (
          <Button onClick={openCreate} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> Nova Organização
          </Button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma organização encontrada"
          description={
            search
              ? "Nenhum resultado para a busca atual."
              : "Cadastre a primeira organização para começar a configuração do sistema."
          }
          action={
            canWrite && !search
              ? { label: "Criar Organização", onClick: openCreate }
              : undefined
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      {/* Drawer */}
      <DrawerShell
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editing ? "Editar Organização" : "Nova Organização"}
        footer={drawerFooter}
      >
        <div className="space-y-4">
          {/* Logo Upload */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Logomarca
            </Label>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl border border-border/50 bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {logoPreview ? "Trocar imagem" : "Enviar imagem"}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1">
                  PNG, JPG ou SVG. Máx 2MB.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="org-name" className="text-xs font-medium text-muted-foreground">
              Nome *
            </Label>
            <Input
              id="org-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nome da organização"
              className="mt-1"
            />
            {formErrors.name && (
              <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="org-slug" className="text-xs font-medium text-muted-foreground">
              Slug *
            </Label>
            <Input
              id="org-slug"
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              placeholder="slug-da-organizacao"
              className="mt-1"
            />
            {formErrors.slug && (
              <p className="text-xs text-destructive mt-1">{formErrors.slug}</p>
            )}
          </div>

          {/* Legal Name */}
          <div>
            <Label htmlFor="org-legal" className="text-xs font-medium text-muted-foreground">
              Razão Social
            </Label>
            <Input
              id="org-legal"
              value={form.legal_name}
              onChange={(e) => setField("legal_name", e.target.value)}
              placeholder="Razão social da empresa"
              className="mt-1"
            />
          </div>

          {/* Brand Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Cor Primária
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.brand_primary_color || "#348846"}
                  onChange={(e) => setField("brand_primary_color", e.target.value)}
                  className="w-8 h-8 rounded border border-border/50 cursor-pointer"
                />
                <Input
                  value={form.brand_primary_color}
                  onChange={(e) => setField("brand_primary_color", e.target.value)}
                  placeholder="#348846"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Cor Secundária
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.brand_secondary_color || "#276233"}
                  onChange={(e) => setField("brand_secondary_color", e.target.value)}
                  className="w-8 h-8 rounded border border-border/50 cursor-pointer"
                />
                <Input
                  value={form.brand_secondary_color}
                  onChange={(e) => setField("brand_secondary_color", e.target.value)}
                  placeholder="#276233"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm font-medium text-foreground">
              Organização ativa
            </Label>
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => setField("active", checked)}
            />
          </div>
        </div>
      </DrawerShell>
    </div>
  );
}

// ── Logo Thumbnail Component ──
function LogoThumb({ logoPath }: { logoPath: string }) {
  const { data: url } = useQuery({
    queryKey: ["org-logo-thumb", logoPath],
    queryFn: async () => {
      const { data } = await supabase.storage
        .from("organization-assets-private")
        .createSignedUrl(logoPath, 3600);
      return data?.signedUrl || null;
    },
    staleTime: 30 * 60 * 1000,
  });

  if (!url) {
    return (
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="Logo"
      className="w-8 h-8 rounded-lg object-contain bg-muted/30"
    />
  );
}
