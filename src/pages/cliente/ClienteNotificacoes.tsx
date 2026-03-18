import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { NotificationItem } from "@/components/ui/notification-item";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClienteNotificacoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications?.filter((n) => !n.is_read).map((n) => n.id) ?? [];
      if (!unread.length) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unread);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div>
      <PageHeader title="Notificações" description="Avisos e comunicados importantes." breadcrumb={["Portal do Cliente", "Notificações"]} />

      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
            Marcar todas como lidas ({unreadCount})
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !notifications?.length ? (
        <EmptyState icon={Bell} title="Nenhuma notificação" description="Você não possui notificações no momento." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              title={n.title}
              message={n.body}
              time={formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
              read={n.is_read}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id);
                if (n.action_url) window.location.href = n.action_url;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
