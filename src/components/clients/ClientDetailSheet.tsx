import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  User, 
  FileText, 
  AlertTriangle,
  Calendar,
  CreditCard,
  Shield,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatFCFA } from "@/utils/formatCurrency";

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

interface ClientDetailSheetProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const claimStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Draft: { label: "Brouillon", color: "bg-slate-100 text-slate-700", icon: FileText },
  Submitted: { label: "Soumis", color: "bg-blue-100 text-blue-700", icon: Clock },
  Reviewed: { label: "En révision", color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  Approved: { label: "Approuvé", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  Rejected: { label: "Rejeté", color: "bg-red-100 text-red-700", icon: XCircle },
  Closed: { label: "Clôturé", color: "bg-gray-100 text-gray-700", icon: CheckCircle },
};

const subscriptionStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
  expired: { label: "Expirée", color: "bg-gray-100 text-gray-700" },
};

export const ClientDetailSheet = ({ 
  client, 
  open, 
  onOpenChange 
}: ClientDetailSheetProps) => {
  // Fetch claims for active clients
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["client-claims", client?.id],
    queryFn: async () => {
      if (!client?.id || client.type !== "active") return [];
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .eq("user_id", client.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!client?.id && client?.type === "active",
  });

  // Fetch subscriptions for active clients
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ["client-subscriptions", client?.id],
    queryFn: async () => {
      if (!client?.id || client.type !== "active") return [];
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          products (
            name,
            category
          )
        `)
        .eq("user_id", client.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!client?.id && client?.type === "active",
  });

  const handleCall = () => {
    if (client?.phone) window.open(`tel:${client.phone}`, "_blank");
  };

  const handleWhatsApp = () => {
    if (client?.phone) {
      const cleanNumber = client.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  const handleEmail = () => {
    if (client?.email) window.open(`mailto:${client.email}`, "_blank");
  };

  if (!client) return null;

  const initials = client.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "CL";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b bg-slate-50/50">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <SheetTitle className="text-lg">
                {client.display_name || "Client"}
              </SheetTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {client.type === "active" ? (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                    Client actif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
                    En attente
                  </Badge>
                )}
                {client.product_interest && (
                  <>
                    <span>•</span>
                    <span className="font-medium">{client.product_interest}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Contact Line */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-4 flex-wrap">
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {client.email}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={handleCall} disabled={!client.phone}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleWhatsApp} 
              disabled={!client.phone}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleEmail} disabled={!client.email}>
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="mx-6 mt-2 grid w-auto grid-cols-3 shrink-0">
            <TabsTrigger value="info" className="gap-1.5 text-xs">
              <User className="h-3.5 w-3.5" />
              Infos
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              Polices
            </TabsTrigger>
            <TabsTrigger value="claims" className="gap-1.5 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              Sinistres
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0">
            {/* Info Tab */}
            <TabsContent value="info" className="mt-0 p-6 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Résumé du portefeuille</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{client.subscriptionsCount}</div>
                    <div className="text-xs text-muted-foreground">Polices actives</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-700">{client.claimsCount}</div>
                    <div className="text-xs text-muted-foreground">Sinistres</div>
                  </div>
                </CardContent>
              </Card>

              {client.lastClaimDate && (
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Dernier sinistre:</span>
                    <span className="font-medium">
                      {format(new Date(client.lastClaimDate), "dd MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                </div>
              )}

              {client.type === "pending" && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Client en attente</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Ce prospect a été converti mais n'a pas encore créé son compte client.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Policies Tab */}
            <TabsContent value="policies" className="mt-0 p-6 space-y-3">
              {client.type === "pending" ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune police pour ce prospect</p>
                </div>
              ) : subscriptionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune police trouvée</p>
                </div>
              ) : (
                subscriptions.map((sub: any) => {
                  const statusConf = subscriptionStatusConfig[sub.status] || subscriptionStatusConfig.active;
                  return (
                    <Card key={sub.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{sub.products?.name || "Police"}</div>
                            <div className="text-sm text-muted-foreground">
                              N° {sub.policy_number}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {sub.products?.category}
                            </Badge>
                          </div>
                          <Badge className={`${statusConf.color} text-xs`}>
                            {statusConf.label}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">Prime mensuelle</div>
                            <div className="font-medium flex items-center gap-1">
                              <CreditCard className="h-3.5 w-3.5" />
                              {formatFCFA(sub.monthly_premium)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Échéance</div>
                            <div className="font-medium flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(sub.end_date), "dd/MM/yyyy")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Claims Tab */}
            <TabsContent value="claims" className="mt-0 p-6 space-y-3">
              {client.type === "pending" ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun sinistre pour ce prospect</p>
                </div>
              ) : claimsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : claims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun sinistre déclaré</p>
                </div>
              ) : (
                claims.map((claim: any) => {
                  const statusConf = claimStatusConfig[claim.status] || claimStatusConfig.Draft;
                  const StatusIcon = statusConf.icon;
                  return (
                    <Card key={claim.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <Badge variant="outline">{claim.claim_type}</Badge>
                            </div>
                            {claim.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {claim.description}
                              </p>
                            )}
                          </div>
                          <Badge className={`${statusConf.color} text-xs gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConf.label}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">Date d'incident</div>
                            <div className="font-medium">
                              {claim.incident_date 
                                ? format(new Date(claim.incident_date), "dd/MM/yyyy")
                                : "N/A"}
                            </div>
                          </div>
                          {claim.cost_estimation && (
                            <div>
                              <div className="text-muted-foreground text-xs">Estimation</div>
                              <div className="font-medium">
                                {formatFCFA(claim.cost_estimation)}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
