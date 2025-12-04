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
  subscriptionsCount: number;
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

      // Fetch clients assigned to this broker via broker_clients table
      const { data: brokerClients, error: brokerClientsError } = await supabase
        .from("broker_clients")
        .select(`
          client_id,
          profiles!broker_clients_client_id_fkey (
            id,
            display_name,
            email,
            phone
          )
        `)
        .eq("broker_id", user.id);

      if (brokerClientsError) throw brokerClientsError;

      // For each client, fetch their claims and subscriptions count
      const clientsWithStats = await Promise.all(
        (brokerClients || []).map(async (brokerClient) => {
          const profile = brokerClient.profiles as any;
          
          // Count claims
          const { count: claimsCount } = await supabase
            .from("claims")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", brokerClient.client_id);

          // Get last claim date
          const { data: lastClaim } = await supabase
            .from("claims")
            .select("created_at")
            .eq("user_id", brokerClient.client_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Count subscriptions
          const { count: subscriptionsCount } = await supabase
            .from("subscriptions")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", brokerClient.client_id);

          return {
            id: profile.id,
            display_name: profile.display_name,
            email: profile.email,
            phone: profile.phone,
            claimsCount: claimsCount || 0,
            subscriptionsCount: subscriptionsCount || 0,
            lastClaimDate: lastClaim?.created_at || null,
          };
        })
      );

      setClients(clientsWithStats);
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
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Client</TableHead>
            <TableHead className="min-w-[140px]">Contact</TableHead>
            <TableHead className="min-w-[70px]">Sinistres</TableHead>
            <TableHead className="min-w-[70px]">Polices</TableHead>
            <TableHead className="min-w-[100px] hidden sm:table-cell">Dernier sinistre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Aucun client assigné
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="font-medium text-sm">
                    {client.display_name || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs sm:text-sm">
                    <div className="truncate max-w-[100px] sm:max-w-none">{client.email}</div>
                    <div className="text-muted-foreground">{client.phone || "N/A"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{client.claimsCount}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default" className="text-xs">{client.subscriptionsCount}</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
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
