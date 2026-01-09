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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, MoreHorizontal, Download, Send, Phone, MessageCircle, Mail } from "lucide-react";
import { PolicyDetailSheet } from "./policies/PolicyDetailSheet";

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
    phone?: string;
  } | null;
  products: {
    name: string;
  } | null;
}

export const BrokerSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<Subscription | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
            email,
            phone
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
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      active: { variant: "default", label: "Actif" },
      cancelled: { variant: "destructive", label: "Annulé" },
      expired: { variant: "secondary", label: "Expiré" },
    };
    const { variant, label } = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleOpenSheet = (policy: Subscription) => {
    setSelectedPolicy(policy);
    setSheetOpen(true);
  };

  const handleCall = (phone?: string) => {
    if (phone) window.open(`tel:${phone}`, "_self");
  };

  const handleWhatsApp = (phone?: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}`, "_blank");
    }
  };

  const handleEmail = (email?: string) => {
    if (email) window.open(`mailto:${email}`, "_self");
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Client</TableHead>
              <TableHead className="min-w-[100px]">Produit</TableHead>
              <TableHead className="min-w-[110px] hidden sm:table-cell">N° Police</TableHead>
              <TableHead className="min-w-[100px]">Prime</TableHead>
              <TableHead className="min-w-[100px] hidden sm:table-cell">Date début</TableHead>
              <TableHead className="min-w-[80px]">Statut</TableHead>
              <TableHead className="min-w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    {format(new Date(sub.start_date), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenSheet(sub)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleCall(sub.profiles?.phone)}
                        disabled={!sub.profiles?.phone}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleWhatsApp(sub.profiles?.phone)}
                        disabled={!sub.profiles?.phone}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleEmail(sub.profiles?.email)}
                        disabled={!sub.profiles?.email}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenSheet(sub)}>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger documents
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenSheet(sub)}>
                            <Send className="mr-2 h-4 w-4" />
                            Renvoyer documents
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

      <PolicyDetailSheet
        policy={selectedPolicy}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};
