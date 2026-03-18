import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/ui/search-bar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ClienteAjuda() {
  const [search, setSearch] = useState("");
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ["faq-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_categories")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ["faq-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_articles")
        .select("*")
        .eq("active", true)
        .eq("audience", "customer")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const isLoading = loadingCats || loadingArticles;

  const filtered = useMemo(() => {
    if (!articles) return [];
    if (!search) return articles;
    const q = search.toLowerCase();
    return articles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q) || a.body_md.toLowerCase().includes(q)
    );
  }, [articles, search]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const a of filtered) {
      const catId = a.faq_category_id || "sem-categoria";
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(a);
    }
    return groups;
  }, [filtered]);

  const getCategoryName = (id: string) => {
    if (id === "sem-categoria") return "Geral";
    return categories?.find((c) => c.id === id)?.name || "Geral";
  };

  return (
    <div>
      <PageHeader title="Central de Ajuda" description="Perguntas frequentes e suporte." breadcrumb={["Portal do Cliente", "Ajuda"]} />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar placeholder="Buscar dúvida..." value={search} onChange={setSearch} className="max-w-sm" />
        <Button variant="outline" className="sm:ml-auto" asChild>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 mr-2" /> Falar no WhatsApp
          </a>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={HelpCircle} title="Nenhuma dúvida encontrada" description="A central de ajuda estará disponível em breve com perguntas frequentes e tutoriais." />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByCategory).map(([catId, arts]) => (
            <div key={catId}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {getCategoryName(catId)}
              </h3>
              <div className="space-y-2">
                {arts.map((article) => {
                  const isOpen = openArticle === article.id;
                  return (
                    <GlassCard key={article.id} className="p-0 overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => setOpenArticle(isOpen ? null : article.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground">{article.title}</span>
                          {article.summary && !isOpen && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{article.summary}</p>
                          )}
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-border/50">
                          <div className="prose prose-sm max-w-none mt-3 text-muted-foreground whitespace-pre-wrap">
                            {article.body_md}
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
