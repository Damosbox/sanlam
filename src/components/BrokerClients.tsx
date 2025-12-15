import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, UserCheck, Clock, Phone, MessageCircle, Mail, MoreHorizontal, Eye } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  claimsCount: number;
  subscriptionsCount: number;
  lastClaimDate: string | null;
  type: "active" | "pending";
  product_interest?: string | null;
}

export const BrokerClients = () => {
  const { data: clients = [], isLoading: loading } = useQuery({
    queryKey: ["broker-clients"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Non authentifié");
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

      // Fetch converted leads (pending clients)
      const { data: convertedLeads, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("assigned_broker_id", user.id)
        .eq("status", "converti")
        .order("updated_at", { ascending: false });

      if (leadsError) throw leadsError;

      // For each active client, fetch their claims and subscriptions count
      const activeClientsWithStats = await Promise.all(
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
            .maybeSingle();

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
            type: "active" as const,
          };
        })
      );

      // Transform converted leads to pending clients
      const pendingClients: Client[] = (convertedLeads || []).map(lead => ({
        id: lead.id,
        display_name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone || lead.whatsapp,
        claimsCount: 0,
        subscriptionsCount: 0,
        lastClaimDate: null,
        type: "pending" as const,
        product_interest: lead.product_interest,
      }));

      return [...activeClientsWithStats, ...pendingClients] as Client[];
    },
  });

  const activeClients = clients.filter(c => c.type === "active");
  const pendingClients = clients.filter(c => c.type === "pending");

  const handleCall = (phone: string | null) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.error("Aucun numéro de téléphone disponible");
    }
  };

  const handleWhatsApp = (phone: string | null) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}`, "_blank");
    } else {
      toast.error("Aucun numéro WhatsApp disponible");
    }
  };

  const handleEmail = (email: string | null) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      toast.error("Aucune adresse email disponible");
    }
  };

  const handleViewDetails = (client: Client) => {
    toast.info(`Détails de ${client.display_name || "Client"}`);
    // TODO: Open client detail sheet
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  const renderClientTable = (clientList: Client[], showProduct = false) => (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Client</TableHead>
            <TableHead className="min-w-[140px]">Contact</TableHead>
            {showProduct ? (
              <TableHead className="min-w-[100px]">Produit</TableHead>
            ) : (
              <>
                <TableHead className="min-w-[70px]">Sinistres</TableHead>
                <TableHead className="min-w-[70px]">Polices</TableHead>
              </>
            )}
            <TableHead className="min-w-[80px]">Statut</TableHead>
            <TableHead className="min-w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showProduct ? 5 : 6} className="text-center text-muted-foreground py-8">
                {showProduct ? "Aucun client en attente" : "Aucun client actif"}
              </TableCell>
            </TableRow>
          ) : (
            clientList.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="font-medium text-sm">
                    {client.display_name || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs sm:text-sm">
                    <div className="truncate max-w-[100px] sm:max-w-none">{client.email || "N/A"}</div>
                    <div className="text-muted-foreground">{client.phone || "N/A"}</div>
                  </div>
                </TableCell>
                {showProduct ? (
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {client.product_interest || "N/A"}
                    </Badge>
                  </TableCell>
                ) : (
                  <>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{client.claimsCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-xs">{client.subscriptionsCount}</Badge>
                    </TableCell>
                  </>
                )}
                <TableCell>
                  {client.type === "active" ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1">
                      <UserCheck className="h-3 w-3" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      En attente
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCall(client.phone)}
                      title="Appeler"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleWhatsApp(client.phone)}
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEmail(client.email)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Envoyer un email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="gap-1.5">
            <Users className="h-4 w-4" />
            Tous ({clients.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5">
            <UserCheck className="h-4 w-4" />
            Actifs ({activeClients.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="h-4 w-4" />
            En attente ({pendingClients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderClientTable(clients)}
        </TabsContent>
        
        <TabsContent value="active">
          {renderClientTable(activeClients)}
        </TabsContent>
        
        <TabsContent value="pending">
          {renderClientTable(pendingClients, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
};
