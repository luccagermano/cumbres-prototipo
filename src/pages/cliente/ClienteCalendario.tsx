import { PageHeader } from "@/components/ui/page-header";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/ui/status-chip";
import { Loader2, DollarSign, ClipboardCheck, Calendar, Wrench } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type CalendarEventItem = {
  date: number;
  label: string;
  color: string;
  type: string;
  title: string;
};

export default function ClienteCalendario() {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handlePrev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const handleNext = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  // Fetch receivable due dates
  const { data: receivables } = useQuery({
    queryKey: ["cal-receivables", user?.id, month, year],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships } = await supabase.from("unit_memberships").select("unit_id").eq("user_id", user!.id).eq("active", true);
      if (!memberships?.length) return [];
      const start = new Date(year, month, 1).toISOString().slice(0, 10);
      const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      const { data } = await supabase.from("receivables").select("id, title, due_date, status").in("unit_id", memberships.map((m) => m.unit_id)).gte("due_date", start).lte("due_date", end);
      return data ?? [];
    },
  });

  // Fetch inspection bookings
  const { data: bookings } = useQuery({
    queryKey: ["cal-bookings", user?.id, month, year],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships } = await supabase.from("unit_memberships").select("unit_id").eq("user_id", user!.id).eq("active", true);
      if (!memberships?.length) return [];
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const { data } = await supabase.from("inspection_bookings").select("id, scheduled_at, booking_status, inspection_type_id").in("unit_id", memberships.map((m) => m.unit_id)).gte("scheduled_at", start).lte("scheduled_at", end);
      return data ?? [];
    },
  });

  // Fetch custom events
  const { data: customEvents } = useQuery({
    queryKey: ["cal-custom", user?.id, month, year],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const { data } = await supabase.from("calendar_custom_events").select("*").gte("starts_at", start).lte("starts_at", end).eq("visible_to_customer", true);
      return data ?? [];
    },
  });

  const allEvents = useMemo<CalendarEventItem[]>(() => {
    const events: CalendarEventItem[] = [];
    receivables?.forEach((r) => {
      const day = new Date(r.due_date + "T12:00:00").getDate();
      events.push({ date: day, label: "Parcela", color: r.status === "paid" ? "hsl(var(--primary))" : "hsl(var(--destructive, 0 84% 60%))", type: "receivable", title: r.title });
    });
    bookings?.forEach((b) => {
      if (!b.scheduled_at) return;
      const day = new Date(b.scheduled_at).getDate();
      events.push({ date: day, label: "Vistoria", color: "hsl(200 80% 50%)", type: "inspection", title: `Vistoria — ${b.booking_status}` });
    });
    customEvents?.forEach((e) => {
      const day = new Date(e.starts_at).getDate();
      events.push({ date: day, label: e.title, color: "hsl(var(--primary))", type: "custom", title: e.title });
    });
    return events;
  }, [receivables, bookings, customEvents]);

  const calendarEvents = allEvents.map((e) => ({ date: e.date, color: e.color, label: e.label }));

  const dayEvents = selectedDay ? allEvents.filter((e) => e.date === selectedDay) : [];

  const iconMap: Record<string, typeof DollarSign> = { receivable: DollarSign, inspection: ClipboardCheck, custom: Calendar };

  return (
    <div>
      <PageHeader title="Calendário" description="Eventos e compromissos relacionados à sua unidade." breadcrumb={["Portal do Cliente", "Calendário"]} />
      <div className="grid lg:grid-cols-2 gap-6">
        <CalendarGrid month={month} year={year} onPrev={handlePrev} onNext={handleNext} events={calendarEvents} onDateClick={setSelectedDay} />
        <GlassCard className="p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">
            {selectedDay ? `Eventos — ${selectedDay} de ${format(new Date(year, month), "MMMM", { locale: ptBR })}` : "Selecione um dia"}
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
                      <span className="text-xs text-muted-foreground">{ev.label}</span>
                    </div>
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
