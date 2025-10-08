import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  claimsCount: number;
  lastClaimDate: string | null;
}

export const BrokerClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erreur",
          description: "Non authentifié",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get all claims assigned to this broker
      const { data: claims, error } = await supabase
        .from("claims")
        .select("user_id, created_at")
        .eq("assigned_broker_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by user_id to get unique clients
      const clientMap = new Map<string, { count: number; lastDate: string }>();
      
      claims?.forEach(claim => {
        const existing = clientMap.get(claim.user_id);
        if (existing) {
          existing.count++;
          if (claim.created_at > existing.lastDate) {
            existing.lastDate = claim.created_at;
          }
        } else {
          clientMap.set(claim.user_id, {
            count: 1,
            lastDate: claim.created_at,
          });
        }
      });

      // Fetch profiles for all unique clients
      const userIds = Array.from(clientMap.keys());
      
      if (userIds.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, email, phone")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const clientsData: Client[] = (profiles || []).map(profile => {
        const stats = clientMap.get(profile.id);
        return {
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          phone: profile.phone,
          claimsCount: stats?.count || 0,
          lastClaimDate: stats?.lastDate || null,
        };
      });

      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Sinistres</TableHead>
            <TableHead>Dernier sinistre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Aucun client assigné
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="font-medium">
                    {client.display_name || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{client.email}</div>
                    <div className="text-muted-foreground">{client.phone || "N/A"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{client.claimsCount}</Badge>
                </TableCell>
                <TableCell>
                  {client.lastClaimDate
                    ? new Date(client.lastClaimDate).toLocaleDateString()
                    : "N/A"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
