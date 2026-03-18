import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Zap } from "lucide-react";

const navItems = [
  { label: "Painel", path: "/executivo", icon: LayoutDashboard },
  { label: "Automação", path: "/executivo/automacao", icon: Zap },
];

export default function ExecutiveLayout() {
  return <DashboardLayout title="Executivo" navItems={navItems} basePath="/executivo" />;
}
