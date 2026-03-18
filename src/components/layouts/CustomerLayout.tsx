import DashboardLayout from "./DashboardLayout";
import {
  Home, Building, DollarSign, FileText, ClipboardCheck,
  Wrench, HelpCircle, Bell, Calendar, Bot,
} from "lucide-react";

const navItems = [
  { label: "Painel", path: "/cliente", icon: Home },
  { label: "Minha Unidade", path: "/cliente/unidade", icon: Building },
  { label: "Financeiro", path: "/cliente/financeiro", icon: DollarSign },
  { label: "Documentos", path: "/cliente/documentos", icon: FileText },
  { label: "Vistoria", path: "/cliente/vistoria", icon: ClipboardCheck },
  { label: "Assistência", path: "/cliente/assistencia", icon: Wrench },
  { label: "Ajuda", path: "/cliente/ajuda", icon: HelpCircle },
  { label: "Notificações", path: "/cliente/notificacoes", icon: Bell },
  { label: "Calendário", path: "/cliente/calendario", icon: Calendar },
  { label: "Assistente", path: "/cliente/assistente", icon: Bot },
];

export default function CustomerLayout() {
  return <DashboardLayout title="Área do Cliente" navItems={navItems} basePath="/cliente" />;
}
