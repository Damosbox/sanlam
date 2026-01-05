import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, CheckCircle, Mail, Eye, XCircle, RefreshCw } from "lucide-react";

interface SurveySend {
  id: string;
  recipient_id: string;
  recipient_type: "client" | "broker";
  status: "pending" | "sent" | "opened" | "completed" | "expired";
  send_channel: string | null;
  scheduled_at: string;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  reminder_count: number;
  created_at: string;
  survey_templates?: {
    name: string;
  };
  profiles?: {
    display_name: string;
    email: string;
  };
}

const STATUS_CONFIG = {
  pending: { label: "En attente", icon: Clock, color: "secondary" },
  sent: { label: "Envoyé", icon: Mail, color: "default" },
  opened: { label: "Ouvert", icon: Eye, color: "outline" },
  completed: { label: "Complété", icon: CheckCircle, color: "default" },
  expired: { label: "Expiré", icon: XCircle, color: "destructive" },
} as const;

export const AdminSurveySends = () => {
  const { data: sends, isLoading } = useQuery({
    queryKey: ["survey-sends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_sends")
        .select(`
          *,
          survey_templates(name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as SurveySend[];
    },
  });

  const getStatusBadge = (status: SurveySend["status"]) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.color as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historique des envois</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{sends?.length || 0} envois</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enquête</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Planifié</TableHead>
                <TableHead>Envoyé</TableHead>
                <TableHead>Relances</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sends?.map((send) => (
                <TableRow key={send.id}>
                  <TableCell className="font-medium">
                    {send.survey_templates?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{send.profiles?.display_name || "Utilisateur"}</div>
                      <div className="text-muted-foreground">{send.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {send.recipient_type === "client" ? "Client" : "Intermédiaire"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(send.status)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(send.scheduled_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {send.sent_at
                      ? format(new Date(send.sent_at), "dd/MM/yyyy HH:mm", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      <span>{send.reminder_count}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {sends?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun envoi d'enquête pour le moment
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
