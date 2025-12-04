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
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px]">Client</TableHead>
            <TableHead className="min-w-[100px]">Produit</TableHead>
            <TableHead className="min-w-[110px] hidden sm:table-cell">N° Police</TableHead>
            <TableHead className="min-w-[100px]">Prime</TableHead>
            <TableHead className="min-w-[100px] hidden sm:table-cell">Date début</TableHead>
            <TableHead className="min-w-[80px]">Statut</TableHead>
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
                    <div className="font-medium text-sm">
                      {sub.profiles?.display_name || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-none">
                      {sub.profiles?.email || "N/A"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{sub.products?.name || "N/A"}</TableCell>
                <TableCell className="font-mono text-xs hidden sm:table-cell">
                  {sub.policy_number}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">{sub.monthly_premium.toLocaleString()} FCFA</TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
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
