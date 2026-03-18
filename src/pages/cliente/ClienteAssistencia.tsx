import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter } from "@/components/ui/chip-filter";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

const statusFilters = [
  { label: "Todos", value: "all" },
  { label: "Aberto", value: "open" },
  { label: "Em andamento", value: "progress" },
  { label: "Concluído", value: "done" },
];

export default function ClienteAssistencia() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<string[]>(["all"]);

  return (
    <div>
      <PageHeader
        title="Assistência Técnica"
        description="Gerencie suas solicitações de assistência."
        breadcrumb={["Portal do Cliente", "Assistência"]}
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar placeholder="Buscar solicitação..." value={search} onChange={setSearch} className="sm:max-w-xs" />
        <ChipFilter options={statusFilters} selected={filters} onChange={setFilters} />
      </div>

      <EmptyState icon={Wrench} title="Nenhuma solicitação" description="Suas solicitações de assistência técnica aparecerão aqui." />
    </div>
  );
}
