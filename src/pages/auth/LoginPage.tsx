import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Building2, Mail, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function LoginPage() {
  const navigate = useNavigate();
  const { org, logoUrl, orgInitials } = useOrg();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao entrar: " + error.message);
    } else {
      toast.success("Login realizado com sucesso!");
      const { data: isAdmin } = await supabase.rpc("get_my_platform_admin_status");
      if (isAdmin === true) {
        navigate("/interno");
      } else {
        const { data: memberships } = await supabase
          .from("organization_memberships")
          .select("role")
          .eq("user_id", authData.user.id)
          .eq("active", true);
        const staffRoles = ["org_admin", "finance_agent", "support_agent", "inspection_agent", "document_agent"];
        const hasStaff = memberships?.some((m) => staffRoles.includes(m.role));
        navigate(hasStaff ? "/interno" : "/cliente");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-panel p-8 w-full max-w-md"
      >
        <div className="flex items-center gap-2.5 mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt={org?.name ?? ""} className="h-8 max-w-[8rem] object-contain shrink-0" />
          ) : orgInitials ? (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{orgInitials}</span>
            </div>
          ) : (
            <Building2 className="h-7 w-7 text-primary" />
          )}
          <span className="font-display text-xl font-bold text-foreground">
            {org?.name ?? "Construtora"}
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Bem-vindo de volta</h1>
        <p className="text-sm text-muted-foreground mb-8">Acesse sua conta para continuar.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Não tem conta?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Criar conta
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
