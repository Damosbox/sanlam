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
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Subscription {
  id: string;
  policy_number: string;
  monthly_premium: number;
  start_date: string;
  status: string;
  user_id: string;
  product_id: string;
  profiles: {
    display_name: string;
    email: string;
  } | null;
  products: {
    name: string;
  } | null;
}

export const BrokerSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          policy_number,
          monthly_premium,
          start_date,
          status,
          user_id,
          product_id,
          profiles!subscriptions_user_id_fkey (
            display_name,
            email
          ),
          products (
            name
          )
        `)
        .eq("assigned_broker_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscriptions:", error);
      } else {
        setSubscriptions(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      cancelled: "destructive",
      expired: "secondary",
    };

    return (
      <Badge variant={statusColors[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead>N° Police</TableHead>
            <TableHead>Prime mensuelle</TableHead>
            <TableHead>Date de début</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Aucune souscription assignée
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {sub.profiles?.display_name || "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sub.profiles?.email || "N/A"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{sub.products?.name || "N/A"}</TableCell>
                <TableCell className="font-mono text-sm">
                  {sub.policy_number}
                </TableCell>
                <TableCell>{sub.monthly_premium.toLocaleString()} FCFA</TableCell>
                <TableCell>
                  {format(new Date(sub.start_date), "dd MMM yyyy", {
                    locale: fr,
                  })}
                </TableCell>
                <TableCell>{getStatusBadge(sub.status)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
