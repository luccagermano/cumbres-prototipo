import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter } from "@/components/ui/chip-filter";
import { Ticket } from "lucide-react";
import { useState } from "react";

const statusFilters = [
  { label: "Todos", value: "all" },
  { label: "Aberto", value: "open" },
  { label: "Em andamento", value: "progress" },
  { label: "Resolvido", value: "resolved" },
];

export default function InternoChamados() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<string[]>(["all"]);

  return (
    <div>
      <PageHeader title="Chamados" description="Gestão de tickets e atendimento técnico." breadcrumb={["Painel Interno", "Chamados"]} />
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar placeholder="Buscar chamado..." value={search} onChange={setSearch} className="sm:max-w-xs" />
        <ChipFilter options={statusFilters} selected={filters} onChange={setFilters} />
      </div>
      <EmptyState icon={Ticket} title="Nenhum chamado" description="Os chamados serão listados aqui em formato de tabela." />
    </div>
  );
}
