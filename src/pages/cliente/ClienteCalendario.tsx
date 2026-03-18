import { PageHeader } from "@/components/ui/page-header";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import { useState } from "react";

export default function ClienteCalendario() {
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
      <PageHeader title="Calendário" description="Eventos e compromissos relacionados à sua unidade." breadcrumb={["Portal do Cliente", "Calendário"]} />
      <div className="max-w-md">
        <CalendarGrid
          month={month}
          year={year}
          onPrev={handlePrev}
          onNext={handleNext}
          events={[]}
        />
      </div>
      <p className="text-sm text-muted-foreground mt-6">Nenhum evento agendado.</p>
    </div>
  );
}
