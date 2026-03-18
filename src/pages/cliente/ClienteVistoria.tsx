import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Loader2, Plus, Calendar, Clock, FileSignature } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "neutral" | "pending" | "error" }> = {
  pending: { label: "Pendente", variant: "pending" },
  confirmed: { label: "Confirmada", variant: "info" },
  completed: { label: "Concluída", variant: "success" },
  cancelled: { label: "Cancelada", variant: "error" },
};

export default function ClienteVistoria() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showBook, setShowBook] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");

  const { data: memberships } = useQuery({
    queryKey: ["my-unit-memberships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("unit_memberships").select("unit_id").eq("user_id", user!.id).eq("active", true);
      return data ?? [];
    },
  });

  const unitIds = memberships?.map((m) => m.unit_id) ?? [];

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["customer-bookings", user?.id],
    enabled: unitIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("inspection_bookings").select("*, inspection_type:inspection_types(name, description, default_duration_minutes, requires_term_signature)").in("unit_id", unitIds).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: types } = useQuery({
    queryKey: ["inspection-types-customer"],
    queryFn: async () => {
      const { data } = await supabase.from("inspection_types").select("*").eq("active", true).in("audience", ["customer", "all"]);
      return data ?? [];
    },
  });

  const { data: slots } = useQuery({
    queryKey: ["available-slots", selectedType],
    enabled: !!selectedType,
    queryFn: async () => {
      const { data } = await supabase.from("inspection_slots").select("*").eq("inspection_type_id", selectedType).eq("status", "available").gte("starts_at", new Date().toISOString()).order("starts_at");
      return data ?? [];
    },
  });

  const selectedTypeObj = types?.find(t => t.id === selectedType);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!unitIds.length || !selectedType) throw new Error("Dados incompletos");
      const slot = slots?.find((s) => s.id === selectedSlot);
      const { error } = await supabase.from("inspection_bookings").insert({
        organization_id: slot?.organization_id ?? "",
        unit_id: unitIds[0],
        inspection_type_id: selectedType,
        slot_id: selectedSlot || null,
        booked_by: user!.id,
        booking_status: "pending",
        scheduled_at: slot?.starts_at ?? null,
        customer_notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vistoria agendada com sucesso!");
      setShowBook(false);
      setSelectedType("");
      setSelectedSlot("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
    },
    onError: () => toast.error("Erro ao agendar vistoria."),
  });

  return (
    <div>
      <PageHeader
        title="Vistoria"
        description="Agendamentos e laudos de vistoria."
        breadcrumb={["Portal do Cliente", "Vistoria"]}
        actions={
          <Dialog open={showBook} onOpenChange={setShowBook}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Agendar Vistoria</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agendar Vistoria</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo de vistoria *</Label>
                  <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setSelectedSlot(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                    <SelectContent>
                      {types?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedTypeObj && (
                    <div className="mt-2 space-y-1">
                      {selectedTypeObj.description && (
                        <p className="text-xs text-muted-foreground">{selectedTypeObj.description}</p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        {selectedTypeObj.default_duration_minutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {selectedTypeObj.default_duration_minutes} min
                          </span>
                        )}
                        {selectedTypeObj.requires_term_signature && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileSignature className="h-3 w-3" /> Requer assinatura de termo
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {slots && slots.length > 0 && (
                  <div>
                    <Label>Horário disponível</Label>
                    <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                      <SelectTrigger><SelectValue placeholder="Selecione horário..." /></SelectTrigger>
                      <SelectContent>
                        {slots.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {format(new Date(s.starts_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            {s.location && ` — ${s.location}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedType && slots && slots.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum horário disponível para este tipo de vistoria no momento.</p>
                )}
                <div>
                  <Label>Observações</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} placeholder="Informações adicionais..." />
                </div>
                <Button className="w-full" onClick={() => bookMutation.mutate()} disabled={!selectedType || bookMutation.isPending}>
                  {bookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                  Confirmar Agendamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !bookings?.length ? (
        <EmptyState icon={ClipboardCheck} title="Nenhuma vistoria agendada" description="Suas vistorias aparecerão aqui quando forem programadas." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const st = statusMap[b.booking_status] ?? { label: b.booking_status, variant: "neutral" as const };
            const typeData = (b as any).inspection_type;
            return (
              <GlassCard key={b.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">{typeData?.name ?? "Vistoria"}</span>
                    {b.scheduled_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(b.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {typeData?.default_duration_minutes && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" /> {typeData.default_duration_minutes} min
                        </span>
                      )}
                      {typeData?.requires_term_signature && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <FileSignature className="h-2.5 w-2.5" /> Termo
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusChip label={st.label} variant={st.variant} size="sm" />
                </div>
                {b.customer_notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2">{b.customer_notes}</p>}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
