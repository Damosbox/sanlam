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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Subscription {
  id: string;
  user_id: string;
  policy_number: string;
  monthly_premium: number;
  status: string;
  start_date: string;
  assigned_broker_id: string | null;
  profiles: {
    display_name: string | null;
    email: string | null;
  };
  products: {
    name: string;
  };
}

interface Broker {
  id: string;
  display_name: string | null;
  email: string | null;
}

export const AdminSubscriptionsTable = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
    fetchBrokers();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          profiles!subscriptions_user_id_fkey(display_name, email),
          products(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les souscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokers = async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["broker", "admin"]);

      if (rolesError) throw rolesError;

      const userIds = rolesData?.map((r) => r.user_id) || [];

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", userIds);

        if (profilesError) throw profilesError;
        setBrokers(profilesData || []);
      }
    } catch (error) {
      console.error("Error fetching brokers:", error);
    }
  };

  const assignBroker = async (subscriptionId: string, brokerId: string | null) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ assigned_broker_id: brokerId })
        .eq("id", subscriptionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: brokerId
          ? "Courtier assigné avec succès"
          : "Courtier désassigné avec succès",
      });

      fetchSubscriptions();
    } catch (error) {
      console.error("Error assigning broker:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le courtier",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      cancelled: "destructive",
      expired: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getBrokerBadge = (subscription: Subscription) => {
    if (!subscription.assigned_broker_id) {
      return <Badge variant="outline">Non assigné</Badge>;
    }
    const broker = brokers.find((b) => b.id === subscription.assigned_broker_id);
    return (
      <Badge variant="secondary">
        {broker?.display_name || broker?.email || "Courtier"}
      </Badge>
    );
  };

  const filteredSubscriptions = showUnassignedOnly
    ? subscriptions.filter((s) => !s.assigned_broker_id)
    : subscriptions;

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant={showUnassignedOnly ? "default" : "outline"}
          onClick={() => setShowUnassignedOnly(!showUnassignedOnly)}
        >
          {showUnassignedOnly ? "Voir toutes" : "Non assignées uniquement"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead>Police</TableHead>
            <TableHead>Prime mensuelle</TableHead>
            <TableHead>Date de début</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Courtier</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSubscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Aucune souscription trouvée
              </TableCell>
            </TableRow>
          ) : (
            filteredSubscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {subscription.profiles?.display_name || "N/A"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {subscription.profiles?.email || "N/A"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{subscription.products?.name || "N/A"}</TableCell>
                <TableCell>{subscription.policy_number}</TableCell>
                <TableCell>{subscription.monthly_premium} €</TableCell>
                <TableCell>
                  {format(new Date(subscription.start_date), "dd MMM yyyy", {
                    locale: fr,
                  })}
                </TableCell>
                <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                <TableCell>{getBrokerBadge(subscription)}</TableCell>
                <TableCell>
                  <Select
                    value={subscription.assigned_broker_id || "unassigned"}
                    onValueChange={(value) =>
                      assignBroker(
                        subscription.id,
                        value === "unassigned" ? null : value
                      )
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Assigner un courtier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Non assigné</SelectItem>
                      {brokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.display_name || broker.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
