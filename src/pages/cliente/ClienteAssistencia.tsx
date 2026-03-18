import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter } from "@/components/ui/chip-filter";
import { TicketRow } from "@/components/ui/ticket-row";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Loader2, ShoppingBag } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusFilters = [
  { label: "Todos", value: "all" },
  { label: "Aberto", value: "open" },
  { label: "Em andamento", value: "in_progress" },
  { label: "Concluído", value: "resolved" },
];

const publicStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "neutral" | "pending" | "error" }> = {
  open: { label: "Aberto", variant: "warning" },
  in_progress: { label: "Em andamento", variant: "info" },
  resolved: { label: "Concluído", variant: "success" },
  closed: { label: "Fechado", variant: "neutral" },
};

export default function ClienteAssistencia() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<string[]>(["all"]);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState("tickets");

  // New ticket form
  const [newCategory, setNewCategory] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Service request form
  const [selService, setSelService] = useState("");
  const [svcDesc, setSvcDesc] = useState("");

  const { data: memberships } = useQuery({
    queryKey: ["my-units", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("unit_memberships").select("unit_id").eq("user_id", user!.id).eq("active", true);
      return data ?? [];
    },
  });
  const unitIds = memberships?.map((m) => m.unit_id) ?? [];

  // Tickets
  const { data: tickets, isLoading: loadingTickets } = useQuery({
    queryKey: ["customer-tickets", user?.id],
    enabled: unitIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*").in("unit_id", unitIds).order("opened_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Service requests
  const { data: serviceRequests, isLoading: loadingSvc } = useQuery({
    queryKey: ["customer-services", user?.id],
    enabled: unitIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("service_requests").select("*").in("unit_id", unitIds).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Warranty rules for display
  const { data: warrantyRules } = useQuery({
    queryKey: ["warranty-rules"],
    queryFn: async () => {
      const { data } = await supabase.from("warranty_rules").select("*").eq("active", true);
      return data ?? [];
    },
  });

  // Service catalog
  const { data: catalog } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: async () => {
      const { data } = await supabase.from("service_catalog").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category_name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filters.includes("all") || filters.includes(t.public_status);
      return matchSearch && matchFilter;
    });
  }, [tickets, search, filters]);

  // Get org_id from first ticket or we'll need it for creation
  const getOrgId = async () => {
    if (!unitIds.length) return null;
    const { data } = await supabase.from("units").select("block:blocks(development:developments(organization_id))").eq("id", unitIds[0]).single();
    return (data as any)?.block?.development?.organization_id ?? null;
  };

  const createTicket = useMutation({
    mutationFn: async () => {
      const orgId = await getOrgId();
      if (!orgId) throw new Error("Organização não encontrada");
      const matchingRule = warrantyRules?.find((r) => r.category_name.toLowerCase() === newCategory.toLowerCase());
      const { error } = await supabase.from("tickets").insert({
        organization_id: orgId,
        unit_id: unitIds[0],
        opened_by: user!.id,
        category_name: newCategory,
        room_name: newRoom || null,
        description: newDesc,
        public_status: "open",
        internal_status: "new",
        priority: "normal",
        warranty_rule_id: matchingRule?.id ?? null,
        warranty_status: matchingRule ? "under_warranty" : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação criada com sucesso!");
      setShowNew(false);
      setNewCategory("");
      setNewRoom("");
      setNewDesc("");
      queryClient.invalidateQueries({ queryKey: ["customer-tickets"] });
    },
    onError: () => toast.error("Erro ao criar solicitação."),
  });

  const createServiceReq = useMutation({
    mutationFn: async () => {
      const orgId = await getOrgId();
      if (!orgId) throw new Error("Organização não encontrada");
      const svc = catalog?.find((c) => c.id === selService);
      const { error } = await supabase.from("service_requests").insert({
        organization_id: orgId,
        unit_id: unitIds[0],
        requested_by: user!.id,
        service_catalog_id: selService || null,
        service_name_snapshot: svc?.name ?? "Serviço avulso",
        description: svcDesc || null,
        request_status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação de serviço criada!");
      setShowNew(false);
      setSelService("");
      setSvcDesc("");
      queryClient.invalidateQueries({ queryKey: ["customer-services"] });
    },
    onError: () => toast.error("Erro ao solicitar serviço."),
  });

  return (
    <div>
      <PageHeader
        title="Assistência Técnica"
        description="Gerencie suas solicitações de assistência e serviços complementares."
        breadcrumb={["Portal do Cliente", "Assistência"]}
        actions={
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Solicitação</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova Solicitação</DialogTitle></DialogHeader>
              <Tabs defaultValue="ticket" className="mt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="ticket" className="flex-1">Assistência Técnica</TabsTrigger>
                  <TabsTrigger value="service" className="flex-1">Serviço Complementar</TabsTrigger>
                </TabsList>
                <TabsContent value="ticket" className="space-y-4 mt-4">
                  <div>
                    <Label>Categoria *</Label>
                    <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Ex: Hidráulica, Elétrica..." maxLength={100} />
                    {warrantyRules && warrantyRules.some((r) => r.category_name.toLowerCase() === newCategory.toLowerCase()) && (
                      <p className="text-xs text-primary mt-1">✓ Esta categoria está coberta pela garantia.</p>
                    )}
                  </div>
                  <div>
                    <Label>Cômodo</Label>
                    <Input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Ex: Cozinha, Banheiro..." maxLength={100} />
                  </div>
                  <div>
                    <Label>Descrição do problema *</Label>
                    <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={4} maxLength={2000} />
                  </div>
                  <Button className="w-full" disabled={!newCategory || !newDesc || createTicket.isPending} onClick={() => createTicket.mutate()}>
                    {createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
                    Abrir Chamado
                  </Button>
                </TabsContent>
                <TabsContent value="service" className="space-y-4 mt-4">
                  <div>
                    <Label>Serviço</Label>
                    <Select value={selService} onValueChange={setSelService}>
                      <SelectTrigger><SelectValue placeholder="Selecione um serviço..." /></SelectTrigger>
                      <SelectContent>
                        {catalog?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}{c.price_label ? ` — ${c.price_label}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} rows={3} maxLength={1000} />
                  </div>
                  <Button className="w-full" disabled={!selService || createServiceReq.isPending} onClick={() => createServiceReq.mutate()}>
                    {createServiceReq.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                    Solicitar Serviço
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="tickets">Chamados ({tickets?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="services">Serviços ({serviceRequests?.length ?? 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "tickets" && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar placeholder="Buscar chamado..." value={search} onChange={setSearch} className="sm:max-w-xs" />
            <ChipFilter options={statusFilters} selected={filters} onChange={setFilters} />
          </div>
          {loadingTickets ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filteredTickets.length === 0 ? (
            <EmptyState icon={Wrench} title="Nenhum chamado" description="Suas solicitações de assistência técnica aparecerão aqui." />
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((t) => {
                const st = publicStatusMap[t.public_status] ?? { label: t.public_status, variant: "neutral" as const };
                return (
                  <TicketRow
                    key={t.id}
                    id={t.id.slice(0, 8)}
                    title={`${t.category_name}${t.room_name ? ` — ${t.room_name}` : ""}`}
                    status={st}
                    date={format(new Date(t.opened_at), "dd/MM/yyyy", { locale: ptBR })}
                    icon={Wrench}
                    onClick={() => navigate(`/cliente/assistencia/${t.id}`)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "services" && (
        <>
          {loadingSvc ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !serviceRequests?.length ? (
            <EmptyState icon={ShoppingBag} title="Nenhuma solicitação de serviço" description="Seus serviços complementares aparecerão aqui." />
          ) : (
            <div className="space-y-2">
              {serviceRequests.map((sr) => (
                <GlassCard key={sr.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-foreground">{sr.service_name_snapshot ?? "Serviço"}</span>
                      {sr.quoted_price && <span className="text-xs text-muted-foreground ml-2">R$ {Number(sr.quoted_price).toFixed(2)}</span>}
                    </div>
                    <StatusChip label={sr.request_status === "pending" ? "Pendente" : sr.request_status === "approved" ? "Aprovado" : sr.request_status} variant={sr.request_status === "pending" ? "pending" : "info"} size="sm" />
                  </div>
                  {sr.description && <p className="text-xs text-muted-foreground mt-1">{sr.description}</p>}
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
