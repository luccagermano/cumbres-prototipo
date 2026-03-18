import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { Shield } from "lucide-react";
import { useState } from "react";

export default function InternoGarantia() {
  const [search, setSearch] = useState("");

  return (
    <div>
      <PageHeader title="Garantia" description="Solicitações e gestão de garantias." breadcrumb={["Painel Interno", "Garantia"]} />
      <div className="mb-6">
        <SearchBar placeholder="Buscar garantia..." value={search} onChange={setSearch} className="max-w-sm" />
      </div>
      <EmptyState icon={Shield} title="Nenhuma solicitação de garantia" description="As solicitações de garantia serão listadas aqui." />
    </div>
  );
}
