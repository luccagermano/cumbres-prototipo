import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { Bell } from "lucide-react";

export default function ClienteNotificacoes() {
  return (
    <div>
      <PageHeader title="Notificações" description="Avisos e comunicados importantes." breadcrumb={["Portal do Cliente", "Notificações"]} />
      <EmptyState icon={Bell} title="Nenhuma notificação" description="Você não possui notificações no momento." />
    </div>
  );
}
