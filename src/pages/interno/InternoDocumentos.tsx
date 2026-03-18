import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { ChipFilter } from "@/components/ui/chip-filter";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { FileText, Plus, Upload, Download, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";

const CATEGORIES = ["contrato", "boleto", "nota_fiscal", "manual", "vistoria", "correspondencia", "outro"];

export default function InternoDocumentos() {
  const { user, memberships } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string[]>(["Todos"]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("outro");
  const [visibleToCustomer, setVisibleToCustomer] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const orgId = memberships[0]?.organization_id;

  const { data: documents, isLoading } = useQuery({
    queryKey: ["interno-documents", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const categoryValues = ["Todos", ...new Set(documents?.map((d) => d.category) ?? [])];
  const categoryOptions = categoryValues.map((c) => ({ label: c, value: c }));

  const filtered = (documents ?? []).filter((d) => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.file_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter.length === 0 || catFilter.includes("Todos") || catFilter.includes(d.category);
    return matchSearch && matchCat;
  });

  const handleUpload = async () => {
    if (!selectedFile || !title || !orgId) return;
    setUploading(true);
    try {
      const filePath = `${orgId}/${crypto.randomUUID()}-${selectedFile.name}`;
      const { error: storageErr } = await supabase.storage
        .from("documents-private")
        .upload(filePath, selectedFile);
      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase.from("documents").insert({
        organization_id: orgId,
        title,
        category,
        file_name: selectedFile.name,
        bucket: "documents-private",
        file_path: filePath,
        mime_type: selectedFile.type || null,
        size_bytes: selectedFile.size,
        visible_to_customer: visibleToCustomer,
        uploaded_by: user!.id,
      });
      if (dbErr) throw dbErr;

      toast.success("Documento enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["interno-documents"] });
      setShowUpload(false);
      setTitle("");
      setCategory("outro");
      setSelectedFile(null);
      setVisibleToCustomer(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (bucket: string, filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60);
    if (error || !data?.signedUrl) {
      toast.error("Erro ao gerar link de download");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <PageHeader title="Documentos" description="Documentos internos e repositório de arquivos." breadcrumb={["Painel Interno", "Documentos"]} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar placeholder="Buscar documento..." value={search} onChange={setSearch} className="max-w-sm" />
        <Button onClick={() => setShowUpload(true)} className="gap-2 ml-auto">
          <Plus className="h-4 w-4" /> Enviar Documento
        </Button>
      </div>

      <div className="mb-6">
        <ChipFilter options={categories} value={catFilter} onChange={setCatFilter} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum documento" description="Os documentos internos serão listados aqui." />
      ) : (
        <div className="space-y-2">
          {filtered.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.file_name} · {formatSize(doc.size_bytes)} · {format(new Date(doc.created_at), "dd/MM/yyyy")}</p>
                </div>
                <StatusChip variant={doc.visible_to_customer ? "success" : "default"} label={doc.visible_to_customer ? "Visível" : "Interno"} />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.bucket, doc.file_path, doc.file_name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar Documento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Contrato de Venda" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo</Label>
              <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={visibleToCustomer} onCheckedChange={setVisibleToCustomer} />
              <Label>Visível para o cliente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={!title || !selectedFile || uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
