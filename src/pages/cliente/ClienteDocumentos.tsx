import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { DocumentRow } from "@/components/ui/document-row";
import { ChipFilter } from "@/components/ui/chip-filter";
import { FileText, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClienteDocumentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["customer-documents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("unit_memberships")
        .select("unit_id")
        .eq("user_id", user!.id)
        .eq("active", true);

      if (!memberships?.length) return [];

      const unitIds = memberships.map((m) => m.unit_id);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .in("unit_id", unitIds)
        .eq("visible_to_customer", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const categories = useMemo(() => {
    if (!documents?.length) return [];
    const cats = [...new Set(documents.map((d) => d.category))];
    return cats.map((c) => ({
      label: c,
      value: c,
      count: documents.filter((d) => d.category === c).length,
    }));
  }, [documents]);

  const filtered = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => {
      const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.file_name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategories.length || selectedCategories.includes(d.category);
      return matchSearch && matchCategory;
    });
  }, [documents, search, selectedCategories]);

  return (
    <div>
      <PageHeader title="Documentos" description="Contratos, manuais e arquivos importantes." breadcrumb={["Portal do Cliente", "Documentos"]} />
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar placeholder="Buscar documento..." value={search} onChange={setSearch} className="max-w-sm" />
      </div>
      {categories.length > 0 && (
        <ChipFilter options={categories} selected={selectedCategories} onChange={setSelectedCategories} className="mb-6" />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum documento" description="Seus documentos estarão disponíveis aqui." />
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <DocumentRow
              key={doc.id}
              title={doc.title}
              category={doc.category}
              date={format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
              onClick={() => navigate(`/cliente/documentos/${doc.id}`)}
              onDownload={async () => {
                const { data } = await supabase.storage.from(doc.bucket).createSignedUrl(doc.file_path, 60);
                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
