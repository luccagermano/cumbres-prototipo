import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { FileText } from "lucide-react";
import { useState } from "react";

export default function InternoDocumentos() {
  const [search, setSearch] = useState("");

  return (
    <div>
      <PageHeader title="Documentos" description="Documentos internos e repositório de arquivos." breadcrumb={["Painel Interno", "Documentos"]} />
      <div className="mb-6">
        <SearchBar placeholder="Buscar documento..." value={search} onChange={setSearch} className="max-w-sm" />
      </div>
      <EmptyState icon={FileText} title="Nenhum documento" description="Os documentos internos serão listados aqui." />
    </div>
  );
}
