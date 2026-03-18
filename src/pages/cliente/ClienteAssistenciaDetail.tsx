import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, ArrowLeft, Loader2, Send, Shield } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "neutral" | "pending" | "error" }> = {
  open: { label: "Aberto", variant: "warning" },
  in_progress: { label: "Em andamento", variant: "info" },
  resolved: { label: "Concluído", variant: "success" },
  closed: { label: "Fechado", variant: "neutral" },
};

export default function ClienteAssistenciaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newMsg, setNewMsg] = useState("");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*, warranty_rule:warranty_rules(category_name, deadline_months, coverage_condition)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ["ticket-messages", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_messages").select("*, author:profiles(full_name)").eq("ticket_id", id!).order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const sendMsg = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: id!,
        author_id: user!.id,
        body: newMsg.trim(),
        is_internal: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMsg("");
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", id] });
    },
    onError: () => toast.error("Erro ao enviar mensagem."),
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Chamado" breadcrumb={["Portal do Cliente", "Assistência", "Carregando..."]} />
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div>
        <PageHeader title="Chamado" breadcrumb={["Portal do Cliente", "Assistência", "Não encontrado"]} />
        <EmptyState icon={Wrench} title="Chamado não encontrado" description="A solicitação não foi encontrada." />
      </div>
    );
  }

  const st = statusMap[ticket.public_status] ?? { label: ticket.public_status, variant: "neutral" as const };

  return (
    <div>
      <PageHeader title={`Chamado — ${ticket.category_name}`} breadcrumb={["Portal do Cliente", "Assistência", `#${ticket.id.slice(0, 8)}`]} />

      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/cliente/assistencia")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      {/* Ticket info */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{ticket.category_name}{ticket.room_name ? ` — ${ticket.room_name}` : ""}</h2>
            <p className="text-xs text-muted-foreground mt-1">Aberto em {format(new Date(ticket.opened_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
          <StatusChip label={st.label} variant={st.variant} />
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>

        {ticket.warranty_rule_id && (ticket as any).warranty_rule && (
          <div className="mt-4 p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
            <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-primary">Garantia aplicável</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(ticket as any).warranty_rule.category_name} — {(ticket as any).warranty_rule.deadline_months} meses
                {(ticket as any).warranty_rule.coverage_condition && ` · ${(ticket as any).warranty_rule.coverage_condition}`}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
          <div>
            <span className="text-xs text-muted-foreground block">Prioridade</span>
            <span className="text-sm font-medium text-foreground capitalize">{ticket.priority}</span>
          </div>
          {ticket.estimated_deadline && (
            <div>
              <span className="text-xs text-muted-foreground block">Previsão</span>
              <span className="text-sm font-medium text-foreground">{format(new Date(ticket.estimated_deadline), "dd/MM/yyyy")}</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Messages */}
      <GlassCard className="p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Mensagens</h3>
        {loadingMsgs ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : messages?.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        ) : (
          <div className="space-y-4 mb-4">
            {messages?.map((msg) => {
              const isMe = msg.author_id === user?.id;
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                    <span className={`text-[11px] font-medium block mb-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {(msg as any).author?.full_name ?? "Usuário"}
                    </span>
                    {msg.body}
                    <span className={`block text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {ticket.public_status !== "closed" && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
            <Textarea value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1" rows={2} maxLength={2000} />
            <Button onClick={() => sendMsg.mutate()} disabled={!newMsg.trim() || sendMsg.isPending} className="self-end">
              {sendMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
