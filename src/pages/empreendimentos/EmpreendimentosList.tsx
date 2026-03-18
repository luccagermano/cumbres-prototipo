import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter } from "@/components/ui/chip-filter";
import { Layers } from "lucide-react";
import { useState } from "react";

const filterOptions = [
  { label: "Todos", value: "all" },
  { label: "Lançamento", value: "launch" },
  { label: "Em Obra", value: "construction" },
  { label: "Entregue", value: "delivered" },
];

export default function EmpreendimentosList() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<string[]>(["all"]);

  return (
    <div className="container py-12">
      <PageHeader
        title="Empreendimentos"
        description="Conheça nossos projetos e encontre o ideal para você."
        breadcrumb={["Empreendimentos"]}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <SearchBar
          placeholder="Buscar empreendimento..."
          value={search}
          onChange={setSearch}
          className="sm:max-w-xs"
        />
        <ChipFilter options={filterOptions} selected={filters} onChange={setFilters} />
      </div>

      <EmptyState
        icon={Layers}
        title="Nenhum empreendimento cadastrado"
        description="Os empreendimentos serão exibidos aqui assim que forem publicados."
      />
    </div>
  );
}
