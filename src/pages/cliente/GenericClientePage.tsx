import { EmptyState } from "@/components/EmptyState";
import { LucideIcon } from "lucide-react";

interface GenericClientePageProps {
  title: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}

export default function GenericClientePage({ title, icon, emptyTitle, emptyDescription }: GenericClientePageProps) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-8">{title}</h1>
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </div>
  );
}
