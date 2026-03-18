import { PageHeader } from "@/components/ui/page-header";
import { ChatLayout } from "@/components/ui/chat-layout";
import { Bot } from "lucide-react";

export default function ClienteAssistente() {
  return (
    <div>
      <PageHeader title="Assistente Virtual" description="Converse com nosso assistente para tirar dúvidas." breadcrumb={["Portal do Cliente", "Assistente"]} />
      <ChatLayout
        messages={[]}
        placeholder="Digite sua dúvida..."
        emptyContent={
          <div className="text-center">
            <div className="p-4 rounded-2xl bg-primary/10 w-fit mx-auto mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">Assistente Virtual</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Em breve você poderá conversar com nosso assistente para tirar dúvidas sobre sua unidade.
            </p>
          </div>
        }
      />
    </div>
  );
}
