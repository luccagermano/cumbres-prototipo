import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { ChatLayout } from "@/components/ui/chat-layout";
import { Bot, FileText, DollarSign, Shield, Ticket, ClipboardCheck, HelpCircle } from "lucide-react";
import { format } from "date-fns";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type ChatMsg = { id: string; role: "user" | "assistant"; content: string; timestamp?: string };

const TOPICS = [
  { key: "contrato", label: "Meu Contrato", icon: FileText },
  { key: "parcelas", label: "Parcelas", icon: DollarSign },
  { key: "garantia", label: "Garantias", icon: Shield },
  { key: "chamados", label: "Chamados", icon: Ticket },
  { key: "vistoria", label: "Vistorias", icon: ClipboardCheck },
  { key: "documentos", label: "Documentos", icon: FileText },
];

export default function ClienteAssistente() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch customer data for context
  const { data: unitMemberships } = useQuery({
    queryKey: ["my-units", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("unit_memberships")
        .select("unit_id")
        .eq("user_id", user!.id)
        .eq("active", true);
      return data ?? [];
    },
  });

  const unitIds = unitMemberships?.map((u) => u.unit_id) ?? [];

  const { data: contracts } = useQuery({
    queryKey: ["my-contracts", unitIds],
    enabled: unitIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_contracts")
        .select("*")
        .in("unit_id", unitIds);
      return data ?? [];
    },
  });

  const { data: receivables } = useQuery({
    queryKey: ["my-receivables", unitIds],
    enabled: unitIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("receivables")
        .select("*")
        .in("unit_id", unitIds)
        .order("due_date");
      return data ?? [];
    },
  });

  const { data: tickets } = useQuery({
    queryKey: ["my-tickets", unitIds],
    enabled: unitIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("id, category_name, public_status, description, opened_at")
        .in("unit_id", unitIds)
        .order("opened_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: inspections } = useQuery({
    queryKey: ["my-inspections", unitIds],
    enabled: unitIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("inspection_bookings")
        .select("id, booking_status, scheduled_at, inspection_type_id")
        .in("unit_id", unitIds)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["my-docs-count", unitIds],
    enabled: unitIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, title, category")
        .in("unit_id", unitIds)
        .eq("visible_to_customer", true);
      return data ?? [];
    },
  });

  const { data: warrantyRules } = useQuery({
    queryKey: ["warranty-rules-assistant"],
    enabled: unitIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("warranty_rules")
        .select("category_name, deadline_months, coverage_condition, recommendation")
        .eq("active", true);
      return data ?? [];
    },
  });

  const buildResponse = useCallback((topic: string): string => {
    const c = contracts?.[0];
    switch (topic.toLowerCase()) {
      case "contrato":
      case "meu contrato": {
        if (!c) return "Não encontrei nenhum contrato vinculado à sua unidade. Entre em contato com o atendimento.";
        return [
          `📄 **Seu Contrato**`,
          `• Número: ${c.contract_number}`,
          `• Status: ${c.contract_status}`,
          `• Valor total: ${BRL.format(Number(c.total_contract_value))}`,
          c.down_payment_amount ? `• Entrada: ${BRL.format(Number(c.down_payment_amount))}` : null,
          c.financed_amount ? `• Financiado: ${BRL.format(Number(c.financed_amount))}` : null,
          c.bank_name ? `• Banco: ${c.bank_name}` : null,
          c.financing_status ? `• Status financiamento: ${c.financing_status}` : null,
          c.signed_at ? `• Assinado em: ${format(new Date(c.signed_at), "dd/MM/yyyy")}` : null,
          c.handover_forecast_at ? `• Previsão entrega: ${format(new Date(c.handover_forecast_at), "dd/MM/yyyy")}` : null,
        ].filter(Boolean).join("\n");
      }
      case "parcelas":
      case "financeiro": {
        if (!receivables?.length) return "Você não possui parcelas registradas no momento.";
        const paid = receivables.filter((r) => r.status === "paid");
        const pending = receivables.filter((r) => r.status === "pending");
        const overdue = receivables.filter((r) => r.status === "overdue");
        const totalPaid = paid.reduce((s, r) => s + Number(r.total_amount), 0);
        const totalPending = pending.reduce((s, r) => s + Number(r.total_amount), 0);
        let msg = `💰 **Resumo Financeiro**\n• Total de parcelas: ${receivables.length}\n• Pagas: ${paid.length} (${BRL.format(totalPaid)})\n• A vencer: ${pending.length} (${BRL.format(totalPending)})`;
        if (overdue.length) msg += `\n• ⚠️ Vencidas: ${overdue.length}`;
        if (pending.length) {
          const next = pending[0];
          msg += `\n\n📅 Próxima parcela: ${next.title} — ${BRL.format(Number(next.total_amount))} em ${format(new Date(next.due_date), "dd/MM/yyyy")}`;
        }
        return msg;
      }
      case "garantia":
      case "garantias": {
        if (!warrantyRules?.length) return "Não há regras de garantia cadastradas para sua organização.";
        let msg = `🛡️ **Garantias Disponíveis**\n`;
        warrantyRules.forEach((w) => {
          msg += `\n• **${w.category_name}** — ${w.deadline_months} meses`;
          if (w.coverage_condition) msg += `\n  Condição: ${w.coverage_condition}`;
          if (w.recommendation) msg += `\n  Recomendação: ${w.recommendation}`;
        });
        return msg;
      }
      case "chamados":
      case "chamado":
      case "tickets": {
        if (!tickets?.length) return "Você não possui chamados abertos.";
        let msg = `🎫 **Seus Chamados** (últimos ${tickets.length})\n`;
        tickets.forEach((t) => {
          msg += `\n• ${t.category_name} — Status: ${t.public_status}`;
          if (t.opened_at) msg += ` (aberto em ${format(new Date(t.opened_at), "dd/MM/yyyy")})`;
        });
        return msg;
      }
      case "vistoria":
      case "vistorias": {
        if (!inspections?.length) return "Você não possui vistorias agendadas.";
        let msg = `🔍 **Suas Vistorias** (${inspections.length})\n`;
        inspections.forEach((i) => {
          msg += `\n• Status: ${i.booking_status}`;
          if (i.scheduled_at) msg += ` — Agendada: ${format(new Date(i.scheduled_at), "dd/MM/yyyy HH:mm")}`;
        });
        return msg;
      }
      case "documentos":
      case "documento": {
        if (!documents?.length) return "Não há documentos disponíveis no momento.";
        const cats = [...new Set(documents.map((d) => d.category))];
        let msg = `📁 **Seus Documentos** (${documents.length} disponíveis)\n• Categorias: ${cats.join(", ")}`;
        msg += `\n\nAcesse a página de Documentos para visualizar e baixar.`;
        return msg;
      }
      default:
        return `Posso ajudar com informações sobre:\n\n${TOPICS.map((t) => `• **${t.label}**`).join("\n")}\n\nDigite o assunto desejado.`;
    }
  }, [contracts, receivables, tickets, inspections, documents, warrantyRules]);

  const handleSend = useCallback((text: string) => {
    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: format(new Date(), "HH:mm"),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      const response = buildResponse(text.trim());
      const botMsg: ChatMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: format(new Date(), "HH:mm"),
      };
      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 600);
  }, [buildResponse]);

  const handleTopicClick = (label: string) => handleSend(label);

  return (
    <div>
      <PageHeader
        title="Assistente Virtual"
        description="Consulte informações sobre seu contrato, parcelas, garantias e mais."
        breadcrumb={["Portal do Cliente", "Assistente"]}
      />
      <ChatLayout
        messages={messages}
        onSend={handleSend}
        loading={loading}
        placeholder="Digite um assunto: contrato, parcelas, garantia..."
        emptyContent={
          <div className="text-center space-y-6">
            <div className="p-4 rounded-2xl bg-primary/10 w-fit mx-auto">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">Assistente Virtual</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                Consulte informações da sua unidade em tempo real. Escolha um assunto abaixo ou digite sua dúvida.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md mx-auto">
              {TOPICS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTopicClick(t.label)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-all text-left"
                >
                  <t.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
}
