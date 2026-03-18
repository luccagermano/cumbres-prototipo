import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClienteDocumentoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: doc, isLoading } = useQuery({
    queryKey: ["document-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const handleDownload = async () => {
    if (!doc) return;
    const { data } = await supabase.storage.from(doc.bucket).createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Documento" breadcrumb={["Portal do Cliente", "Documentos", "Carregando..."]} />
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div>
        <PageHeader title="Documento" breadcrumb={["Portal do Cliente", "Documentos", "Não encontrado"]} />
        <EmptyState icon={FileText} title="Documento não encontrado" description="O documento solicitado não foi encontrado." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={doc.title} breadcrumb={["Portal do Cliente", "Documentos", doc.title]} />

      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/cliente/documentos")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <GlassCard className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{doc.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{doc.file_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div>
            <span className="text-xs text-muted-foreground block">Categoria</span>
            <span className="text-sm font-medium text-foreground">{doc.category}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Tamanho</span>
            <span className="text-sm font-medium text-foreground">{formatBytes(doc.size_bytes)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Tipo</span>
            <span className="text-sm font-medium text-foreground">{doc.mime_type || "—"}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Data</span>
            <span className="text-sm font-medium text-foreground">
              {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> Baixar arquivo
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
