import { PageHeader } from "@/components/ui/page-header";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Loader2, Calendar, ClipboardCheck, Wrench } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AgendaEvent = {
  date: number;
  label: string;
  color: string;
  type: string;
  title: string;
  time?: string;
  status?: string;
};

export default function InternoAgenda() {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const handlePrev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const handleNext = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  // Inspection bookings
  const { data: bookings } = useQuery({
    queryKey: ["agenda-bookings", month, year],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("inspection_bookings").select("*, inspection_type:inspection_types(name)").gte("scheduled_at", start).lte("scheduled_at", end).order("scheduled_at");
      return data ?? [];
    },
  });

  // Custom events (staff sees all)
  const { data: customEvents } = useQuery({
    queryKey: ["agenda-custom", month, year],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("calendar_custom_events").select("*").gte("starts_at", start).lte("starts_at", end).order("starts_at");
      return data ?? [];
    },
  });

  // Tickets with scheduled status
  const { data: scheduledTickets } = useQuery({
    queryKey: ["agenda-tickets", month, year],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("*").eq("internal_status", "scheduled").not("estimated_deadline", "is", null);
      return (data ?? []).filter((t) => {
        if (!t.estimated_deadline) return false;
        const d = new Date(t.estimated_deadline);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    },
  });

  const allEvents = useMemo<AgendaEvent[]>(() => {
    const events: AgendaEvent[] = [];
    bookings?.forEach((b) => {
      if (!b.scheduled_at) return;
      const d = new Date(b.scheduled_at);
      events.push({
        date: d.getDate(),
        label: "Vistoria",
        color: "hsl(200 80% 50%)",
        type: "inspection",
        title: (b as any).inspection_type?.name ?? "Vistoria",
        time: format(d, "HH:mm"),
        status: b.booking_status,
      });
    });
    customEvents?.forEach((e) => {
      const d = new Date(e.starts_at);
      events.push({
        date: d.getDate(),
        label: e.event_type,
        color: "hsl(var(--primary))",
        type: "custom",
        title: e.title,
        time: format(d, "HH:mm"),
      });
    });
    scheduledTickets?.forEach((t) => {
      const d = new Date(t.estimated_deadline!);
      events.push({
        date: d.getDate(),
        label: "Visita técnica",
        color: "hsl(30 90% 50%)",
        type: "ticket",
        title: `${t.category_name}${t.room_name ? ` — ${t.room_name}` : ""}`,
        status: t.internal_status,
      });
    });
    return events;
  }, [bookings, customEvents, scheduledTickets]);

  const calendarEvents = allEvents.map((e) => ({ date: e.date, color: e.color, label: e.label }));
  const dayEvents = selectedDay ? allEvents.filter((e) => e.date === selectedDay) : [];

  const iconMap: Record<string, typeof Calendar> = { inspection: ClipboardCheck, custom: Calendar, ticket: Wrench };

  return (
    <div>
      <PageHeader title="Agenda" description="Calendário da equipe e eventos programados." breadcrumb={["Painel Interno", "Agenda"]} />
      <div className="grid lg:grid-cols-2 gap-6">
        <CalendarGrid month={month} year={year} onPrev={handlePrev} onNext={handleNext} events={calendarEvents} onDateClick={setSelectedDay} />
        <GlassCard className="p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">
            {selectedDay ? `${selectedDay} de ${format(new Date(year, month), "MMMM yyyy", { locale: ptBR })}` : "Selecione um dia"}
          </h3>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento neste dia.</p>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((ev, i) => {
                const Icon = iconMap[ev.type] || Calendar;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                    <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block truncate">{ev.title}</span>
                      <span className="text-xs text-muted-foreground">{ev.time && `${ev.time} · `}{ev.label}</span>
                    </div>
                    {ev.status && <StatusChip label={ev.status} variant="info" size="sm" />}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
