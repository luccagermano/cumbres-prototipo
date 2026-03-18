import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, ArrowLeft, Loader2, Send, Shield, Info } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInternalPermissions } from "@/hooks/useInternalPermissions";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const internalStatuses = [
  { value: "new", label: "Novo" },
  { value: "triaged", label: "Triado" },
  { value: "in_progress", label: "Em andamento" },
  { value: "waiting", label: "Aguardando" },
  { value: "scheduled", label: "Agendado" },
  { value: "resolved", label: "Resolvido" },
  { value: "closed", label: "Fechado" },
];

const publicStatuses = [
  { value: "open", label: "Aberto" },
  { value: "in_progress", label: "Em andamento" },
  { value: "resolved", label: "Concluído" },
  { value: "closed", label: "Fechado" },
];

export default function InternoChamadoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newMsg, setNewMsg] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket-detail-internal", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, warranty_rule:warranty_rules(*), opened_profile:profiles!tickets_opened_by_fkey(full_name, email), assigned_profile:profiles!tickets_assigned_to_fkey(full_name), ticket_category:ticket_categories(name), ticket_subcategory:ticket_subcategories(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["ticket-messages-internal", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_messages").select("*, author:profiles(full_name)").eq("ticket_id", id!).order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Staff in same org for assignment
  const { data: staffMembers } = useQuery({
    queryKey: ["staff-members", ticket?.organization_id],
    enabled: !!ticket,
    queryFn: async () => {
      const { data } = await supabase.from("organization_memberships").select("user_id, role, profile:profiles!organization_memberships_user_id_fkey(full_name)").eq("organization_id", ticket!.organization_id).eq("active", true);
      return data ?? [];
    },
  });

  const updateTicket = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from("tickets").update(updates).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chamado atualizado.");
      queryClient.invalidateQueries({ queryKey: ["ticket-detail-internal", id] });
    },
    onError: () => toast.error("Erro ao atualizar."),
  });

  const sendMsg = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: id!,
        author_id: user!.id,
        body: newMsg.trim(),
        is_internal: isInternal,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMsg("");
      queryClient.invalidateQueries({ queryKey: ["ticket-messages-internal", id] });
    },
    onError: () => toast.error("Erro ao enviar mensagem."),
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Chamado" breadcrumb={["Painel Interno", "Chamados", "Carregando..."]} />
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div>
        <PageHeader title="Chamado" breadcrumb={["Painel Interno", "Chamados", "Não encontrado"]} />
        <EmptyState icon={Ticket} title="Chamado não encontrado" description="O chamado solicitado não foi encontrado." />
      </div>
    );
  }

  const warrantyRule = (ticket as any).warranty_rule;
  const linkedCategory = (ticket as any).ticket_category?.name;
  const linkedSubcategory = (ticket as any).ticket_subcategory?.name;

  return (
    <div>
      <PageHeader title={`Chamado #${ticket.id.slice(0, 8)}`} breadcrumb={["Painel Interno", "Chamados", `#${ticket.id.slice(0, 8)}`]} />

      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/interno/chamados")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{ticket.category_name}{ticket.room_name ? ` — ${ticket.room_name}` : ""}</h2>
                {/* Normalized category labels */}
                {(linkedCategory || linkedSubcategory) && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {linkedCategory && <StatusChip label={linkedCategory} variant="info" size="sm" dot={false} />}
                    {linkedSubcategory && <StatusChip label={linkedSubcategory} variant="neutral" size="sm" dot={false} />}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Aberto por {(ticket as any).opened_profile?.full_name ?? "—"} em {format(new Date(ticket.opened_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>

            {/* Warranty rule context */}
            {ticket.warranty_rule_id && warrantyRule && (
              <div className="mt-4 p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-primary">Garantia aplicável</span>
                  <p className="text-xs text-muted-foreground">
                    {warrantyRule.category_name} — {warrantyRule.deadline_months} meses
                    {warrantyRule.coverage_condition && ` · ${warrantyRule.coverage_condition}`}
                  </p>
                  {warrantyRule.recommendation && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                      {warrantyRule.recommendation}
                    </p>
                  )}
                  {warrantyRule.contract_clause && (
                    <p className="text-[11px] text-muted-foreground">Cláusula: {warrantyRule.contract_clause}</p>
                  )}
                  {warrantyRule.priority_hint && (
                    <p className="text-[11px] text-muted-foreground">Prioridade sugerida: {warrantyRule.priority_hint}</p>
                  )}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Messages */}
          <GlassCard className="p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">Mensagens</h3>
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {messages?.map((msg) => {
                const isMe = msg.author_id === user?.id;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.is_internal ? "bg-amber-500/10 border border-amber-500/20 text-foreground rounded-bl-md" : isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-medium ${msg.is_internal ? "text-amber-600" : isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {(msg as any).author?.full_name ?? "Usuário"}
                        </span>
                        {msg.is_internal && <span className="text-[10px] bg-amber-500/20 text-amber-700 px-1.5 py-0.5 rounded-full">interno</span>}
                      </div>
                      {msg.body}
                      <span className={`block text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {!messages?.length && <p className="text-sm text-muted-foreground">Nenhuma mensagem.</p>}
            </div>
            <div className="flex gap-2 pt-4 border-t border-border/50">
              <Textarea value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Responder..." className="flex-1" rows={2} maxLength={2000} />
              <div className="flex flex-col gap-1 self-end">
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
                  Interno
                </label>
                <Button size="sm" onClick={() => sendMsg.mutate()} disabled={!newMsg.trim() || sendMsg.isPending}>
                  {sendMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-6">
          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold text-foreground mb-4">Gerenciamento</h4>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Status Interno</Label>
                <Select value={ticket.internal_status} onValueChange={(v) => updateTicket.mutate({ internal_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {internalStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status Público</Label>
                <Select value={ticket.public_status} onValueChange={(v) => updateTicket.mutate({ public_status: v, ...(v === "closed" ? { closed_at: new Date().toISOString() } : {}) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {publicStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prioridade</Label>
                <Select value={ticket.priority} onValueChange={(v) => updateTicket.mutate({ priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Responsável</Label>
                <Select value={ticket.assigned_to ?? ""} onValueChange={(v) => updateTicket.mutate({ assigned_to: v || null })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {staffMembers?.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>{(m as any).profile?.full_name ?? m.user_id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Previsão de Conclusão</Label>
                <Input type="date" value={ticket.estimated_deadline ?? ""} onChange={(e) => updateTicket.mutate({ estimated_deadline: e.target.value || null })} />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">Informações</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Garantia</span><span className="text-foreground">{ticket.warranty_status ?? "N/A"}</span></div>
              {linkedCategory && <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span className="text-foreground">{linkedCategory}</span></div>}
              {linkedSubcategory && <div className="flex justify-between"><span className="text-muted-foreground">Subcategoria</span><span className="text-foreground">{linkedSubcategory}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Atualizado</span><span className="text-foreground">{format(new Date(ticket.updated_at), "dd/MM/yyyy", { locale: ptBR })}</span></div>
              {ticket.closed_at && <div className="flex justify-between"><span className="text-muted-foreground">Fechado</span><span className="text-foreground">{format(new Date(ticket.closed_at), "dd/MM/yyyy", { locale: ptBR })}</span></div>}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
