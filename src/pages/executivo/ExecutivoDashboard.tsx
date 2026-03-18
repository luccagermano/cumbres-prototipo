import { EmptyState } from "@/components/EmptyState";
import { LayoutDashboard } from "lucide-react";

export default function ExecutivoDashboard() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-8">Painel Executivo</h1>
      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard em construção"
        description="Os indicadores executivos serão exibidos aqui em breve."
      />
    </div>
  );
}
