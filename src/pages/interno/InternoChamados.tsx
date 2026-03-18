import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter } from "@/components/ui/chip-filter";
import { TicketRow } from "@/components/ui/ticket-row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusFilters = [
  { label: "Todos", value: "all" },
  { label: "Novo", value: "new" },
  { label: "Em andamento", value: "in_progress" },
  { label: "Aguardando", value: "waiting" },
  { label: "Resolvido", value: "resolved" },
];

const internalStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "neutral" | "pending" | "error" }> = {
  new: { label: "Novo", variant: "warning" },
  triaged: { label: "Triado", variant: "info" },
  in_progress: { label: "Em andamento", variant: "info" },
  waiting: { label: "Aguardando", variant: "pending" },
  scheduled: { label: "Agendado", variant: "info" },
  resolved: { label: "Resolvido", variant: "success" },
  closed: { label: "Fechado", variant: "neutral" },
};

export default function InternoChamados() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<string[]>(["all"]);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Ticket categories for filter
  const { data: ticketCategories } = useQuery({
    queryKey: ["ticket-categories-filter"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("ticket_categories").select("id, name").eq("active", true).order("name");
      return data ?? [];
    },
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["internal-tickets"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, opened_profile:profiles!tickets_opened_by_fkey(full_name), assigned_profile:profiles!tickets_assigned_to_fkey(full_name)")
        .order("opened_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category_name.toLowerCase().includes(search.toLowerCase()) || t.id.includes(search);
      const matchFilter = filters.includes("all") || filters.includes(t.internal_status);
      const matchCategory = categoryFilter === "all" || t.ticket_category_id === categoryFilter;
      return matchSearch && matchFilter && matchCategory;
    });
  }, [tickets, search, filters, categoryFilter]);

  return (
    <div>
      <PageHeader title="Chamados" description="Gestão de tickets e atendimento técnico." breadcrumb={["Painel Interno", "Chamados"]} />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar placeholder="Buscar chamado..." value={search} onChange={setSearch} className="sm:max-w-xs" />
        <ChipFilter options={statusFilters} selected={filters} onChange={setFilters} />
        {ticketCategories && ticketCategories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {ticketCategories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Ticket} title="Nenhum chamado" description="Os chamados serão listados aqui." />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const st = internalStatusMap[t.internal_status] ?? { label: t.internal_status, variant: "neutral" as const };
            return (
              <TicketRow
                key={t.id}
                id={t.id.slice(0, 8)}
                title={`${t.category_name}${t.room_name ? ` — ${t.room_name}` : ""}`}
                status={st}
                date={format(new Date(t.opened_at), "dd/MM/yyyy", { locale: ptBR })}
                assignee={(t as any).assigned_profile?.full_name ?? "Não atribuído"}
                icon={Ticket}
                onClick={() => navigate(`/interno/chamados/${t.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
