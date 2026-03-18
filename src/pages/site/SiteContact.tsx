import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export default function SiteContact() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", message: "" });

  // Get first org for lead insertion
  const { data: orgs } = useQuery({
    queryKey: ["public-orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id").limit(1);
      return data ?? [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    if (!orgs?.length) {
      toast.error("Nenhuma organização disponível.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      organization_id: orgs[0].id,
      source_type: "contact_form",
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim() || null,
      interest_subject: "Contato pelo site",
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } else {
      toast.success("Mensagem enviada com sucesso!");
      setForm({ full_name: "", email: "", phone: "", message: "" });
    }
  };

  return (
    <div className="container py-12">
      <PageHeader
        title="Contato"
        description="Envie uma mensagem ou encontre nossos canais de atendimento."
        breadcrumb={["Site", "Contato"]}
      />
      <div className="max-w-lg mx-auto">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Envie sua mensagem</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome completo *</Label>
              <Input id="name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} maxLength={100} required />
            </div>
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} maxLength={255} required />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} maxLength={20} />
            </div>
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea id="message" rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} maxLength={1000} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
