import { PageHeader } from "@/components/ui/page-header";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import { useState } from "react";

export default function InternoAgenda() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div>
      <PageHeader title="Agenda" description="Calendário da equipe e eventos programados." breadcrumb={["Painel Interno", "Agenda"]} />
      <div className="grid lg:grid-cols-2 gap-6">
        <CalendarGrid month={month} year={year} onPrev={handlePrev} onNext={handleNext} events={[]} />
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-3">Eventos do Dia</h3>
          <p className="text-sm text-muted-foreground">Nenhum evento agendado para hoje.</p>
        </div>
      </div>
    </div>
  );
}
