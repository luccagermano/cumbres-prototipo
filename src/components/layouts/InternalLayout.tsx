import DashboardLayout from "./DashboardLayout";
import { Home, Ticket, Shield, Calendar, FileText, DollarSign } from "lucide-react";

const navItems = [
  { label: "Painel", path: "/interno", icon: Home },
  { label: "Chamados", path: "/interno/chamados", icon: Ticket },
  { label: "Garantia", path: "/interno/garantia", icon: Shield },
  { label: "Agenda", path: "/interno/agenda", icon: Calendar },
  { label: "Documentos", path: "/interno/documentos", icon: FileText },
  { label: "Financeiro", path: "/interno/financeiro", icon: DollarSign },
];

export default function InternalLayout() {
  return <DashboardLayout title="Área Interna" navItems={navItems} basePath="/interno" />;
}
