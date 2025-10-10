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

      // Fetch claims assigned to this broker
      const { data: claims, error: claimsError } = await supabase
        .from("claims")
        .select(`
          user_id,
          created_at,
          profiles!inner (
            id,
            display_name,
            email,
            phone
          )
        `)
        .eq("assigned_broker_id", user.id)
        .order("created_at", { ascending: false });

      if (claimsError) throw claimsError;

      // Fetch subscriptions assigned to this broker
      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select(`
          user_id,
          profiles!inner (
            id,
            display_name,
            email,
            phone
          )
        `)
        .eq("assigned_broker_id", user.id);

      if (subsError) throw subsError;

      // Group by user_id to merge claims and subscriptions data
      const clientMap = new Map<string, Client>();
      
      // Process claims
      claims?.forEach(claim => {
        const profile = claim.profiles as any;
        const existing = clientMap.get(claim.user_id);
        
        if (existing) {
          existing.claimsCount++;
          if (claim.created_at > (existing.lastClaimDate || "")) {
            existing.lastClaimDate = claim.created_at;
          }
        } else {
          clientMap.set(claim.user_id, {
            id: profile.id,
            display_name: profile.display_name,
            email: profile.email,
            phone: profile.phone,
            claimsCount: 1,
            subscriptionsCount: 0,
            lastClaimDate: claim.created_at,
          });
        }
      });

      // Process subscriptions
      subscriptions?.forEach(sub => {
        const profile = sub.profiles as any;
        const existing = clientMap.get(sub.user_id);
        
        if (existing) {
          existing.subscriptionsCount++;
        } else {
          clientMap.set(sub.user_id, {
            id: profile.id,
            display_name: profile.display_name,
            email: profile.email,
            phone: profile.phone,
            claimsCount: 0,
            subscriptionsCount: 1,
            lastClaimDate: null,
          });
        }
      });

      setClients(Array.from(clientMap.values()));
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
            <TableHead>Polices</TableHead>
            <TableHead>Dernier sinistre</TableHead>
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
                  <Badge variant="default">{client.subscriptionsCount}</Badge>
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
