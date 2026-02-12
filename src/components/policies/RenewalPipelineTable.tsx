import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Phone, 
  MessageCircle, 
  MoreHorizontal, 
  Eye, 
  Star,
  Calendar,
  RefreshCw,
  Edit,
  FileText,
  Download,
  Send,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { formatFCFA } from "@/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ProductType } from "@/components/broker/dashboard/ProductSelector";
import { RenewalStatusDropdown } from "./RenewalStatusDropdown";
import { ChurnReasonDialog } from "./ChurnReasonDialog";
import { RenewalDetailDialog } from "./RenewalDetailDialog";

interface RenewalPipelineTableProps {
  selectedProduct: ProductType;
  contactFilter: "all" | "contacted" | "not_contacted";
  renewalFilter: "all" | "renewed" | "pending" | "lost";
  searchQuery?: string;
  onViewClient?: (clientId: string) => void;
}

interface RenewalItem {
  id: string;
  policy_number: string;
  client_name: string;
  client_id: string;
  client_phone: string | null;
  client_email: string | null;
  product_name: string;
  product_category: string;
  end_date: string;
  premium: number;
  days_until_expiry: number;
  object_identifier: string;
  contact_status: "not_contacted" | "contacted" | "reached" | "phone_issue" | null;
  renewal_status: "pending" | "renewed" | "lost" | null;
}

export const RenewalPipelineTable = ({ 
  selectedProduct, 
  contactFilter,
  renewalFilter,
  searchQuery = "",
  onViewClient 
}: RenewalPipelineTableProps) => {
  const [churnDialogOpen, setChurnDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<{ id: string; productType: string } | null>(null);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState<any>(null);

  const { data: renewals = [], isLoading } = useQuery({
    queryKey: ["broker-renewals", selectedProduct],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          products (name, category),
          profiles:user_id (id, display_name, email, phone)
        `)
        .eq("assigned_broker_id", user.id)
        .order("end_date", { ascending: true });

      if (error) throw error;

      const now = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(now.getMonth() + 3);

      // Filter subscriptions expiring within 3 months
      const upcomingRenewals = (subscriptions || []).filter(sub => {
        const endDate = new Date(sub.end_date);
        return endDate <= threeMonthsFromNow;
      });

      // Filter by product if needed
      let filtered = upcomingRenewals;
      if (selectedProduct !== "all") {
        const categoryMap: Record<string, string[]> = {
          auto: ["auto", "automobile"],
          mrh: ["mrh", "habitation"],
          sante: ["sante", "santé"],
          vie: ["vie", "epargne"],
          obseques: ["obseques", "obsèques"],
        };
        const categories = categoryMap[selectedProduct] || [];
        filtered = upcomingRenewals.filter(sub => {
          const cat = ((sub.products as any)?.category || "").toLowerCase();
          const name = ((sub.products as any)?.name || "").toLowerCase();
          return categories.some(c => cat.includes(c) || name.includes(c));
        });
      }

      return filtered.map((sub): RenewalItem => {
        const endDate = new Date(sub.end_date);
        const daysUntil = differenceInDays(endDate, now);
        const profile = sub.profiles as any;
        const product = sub.products as any;
        
        // Use real object_identifier from DB or generate placeholder
        const objectId = sub.object_identifier || sub.policy_number;

        return {
          id: sub.id,
          policy_number: sub.policy_number,
          client_name: profile?.display_name || "Client",
          client_id: profile?.id || sub.user_id,
          client_phone: profile?.phone,
          client_email: profile?.email,
          product_name: product?.name || "Produit",
          product_category: product?.category || "",
          end_date: sub.end_date,
          premium: sub.monthly_premium * 12,
          days_until_expiry: daysUntil,
          object_identifier: objectId,
          // Use real statuses from database
          contact_status: sub.contact_status as RenewalItem["contact_status"],
          renewal_status: sub.renewal_status as RenewalItem["renewal_status"],
        };
      });
    },
  });

  // Apply filters
  const filteredRenewals = renewals.filter(r => {
    const contactStatus = r.contact_status || "not_contacted";
    const renewalStatus = r.renewal_status || "pending";
    
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesSearch = 
        r.client_name.toLowerCase().includes(search) ||
        r.policy_number.toLowerCase().includes(search) ||
        r.object_identifier.toLowerCase().includes(search) ||
        r.product_name.toLowerCase().includes(search) ||
        r.client_email?.toLowerCase().includes(search) ||
        r.client_phone?.includes(search);
      if (!matchesSearch) return false;
    }
    
    if (contactFilter === "contacted" && contactStatus === "not_contacted") return false;
    if (contactFilter === "not_contacted" && contactStatus !== "not_contacted") return false;
    if (renewalFilter !== "all" && renewalStatus !== renewalFilter) return false;
    return true;
  });

  const handleCall = (phone: string | null) => {
    if (phone) {
      window.open(`tel:${phone}`, "_blank");
    } else {
      toast.error("Aucun numéro disponible");
    }
  };

  const handleWhatsApp = (phone: string | null) => {
    if (phone) {
      const cleanNumber = phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    } else {
      toast.error("Aucun numéro disponible");
    }
  };

  const handleChurnReasonNeeded = (subscriptionId: string, productCategory: string) => {
    setSelectedSubscription({ id: subscriptionId, productType: productCategory });
    setChurnDialogOpen(true);
  };

  const handleRenew = (renewal: RenewalItem) => {
    setSelectedRenewal({
      id: renewal.id,
      policy_number: renewal.policy_number,
      client_name: renewal.client_name,
      client_phone: renewal.client_phone,
      client_email: renewal.client_email,
      product_name: renewal.product_name,
      current_premium: renewal.premium,
      end_date: renewal.end_date,
    });
    setRenewalDialogOpen(true);
  };

  // Get dynamic column header based on product
  const getObjectColumnHeader = () => {
    switch (selectedProduct) {
      case "auto": return "Immat.";
      case "obseques": return "Formule";
      case "obseques": return "Formule";
      default: return "Identifiant";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (filteredRenewals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>
          {searchQuery || contactFilter !== "all" || renewalFilter !== "all"
            ? "Aucun renouvellement trouvé pour ces filtres"
            : "Aucun renouvellement à traiter"
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[150px]">Client</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead className="hidden md:table-cell">{getObjectColumnHeader()}</TableHead>
              <TableHead className="hidden lg:table-cell">Échéance</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Prime</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRenewals.map((renewal) => {
              const isUrgent = renewal.days_until_expiry <= 7;
              const isOverdue = renewal.days_until_expiry < 0;

              return (
                <TableRow 
                  key={renewal.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    isOverdue && "bg-red-50/50",
                    isUrgent && !isOverdue && "bg-amber-50/50"
                  )}
                >
                  <TableCell className="py-3">
                    <div>
                      <button
                        className="font-medium text-sm hover:text-primary hover:underline text-left"
                        onClick={() => onViewClient?.(renewal.client_id)}
                      >
                        {renewal.client_name}
                      </button>
                      <p className="text-xs text-muted-foreground">{renewal.policy_number}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs">
                      {renewal.product_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3 text-sm">
                    {renewal.object_identifier}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm",
                        isOverdue && "text-destructive font-medium",
                        isUrgent && !isOverdue && "text-amber-600 font-medium"
                      )}>
                        {format(new Date(renewal.end_date), "dd/MM/yy")}
                      </span>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-[10px] px-1.5">
                          Expiré
                        </Badge>
                      )}
                      {isUrgent && !isOverdue && (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5">
                          {renewal.days_until_expiry}j
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-3 text-right text-sm font-medium">
                    {formatFCFA(renewal.premium)}
                  </TableCell>
                  <TableCell className="py-3">
                    <RenewalStatusDropdown
                      subscriptionId={renewal.id}
                      type="contact"
                      currentValue={renewal.contact_status}
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <RenewalStatusDropdown
                      subscriptionId={renewal.id}
                      type="renewal"
                      currentValue={renewal.renewal_status}
                      onChurnReasonNeeded={() => handleChurnReasonNeeded(renewal.id, renewal.product_category)}
                    />
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCall(renewal.client_phone)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleWhatsApp(renewal.client_phone)}
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
                          <DropdownMenuItem onClick={() => onViewClient?.(renewal.client_id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir client
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewClient?.(renewal.client_id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Score valeur
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info("Modification des garanties à venir")}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier les garanties
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Génération du devis...")}>
                            <FileText className="h-4 w-4 mr-2" />
                            Générer devis
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleRenew(renewal)}
                            className="text-primary"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Renouveler
                          </DropdownMenuItem>
                          {renewal.renewal_status === "renewed" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toast.info("Téléchargement de l'avenant...")}>
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger avenant
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedSubscription && (
        <ChurnReasonDialog
          open={churnDialogOpen}
          onOpenChange={setChurnDialogOpen}
          subscriptionId={selectedSubscription.id}
          productType={selectedSubscription.productType}
        />
      )}

      <RenewalDetailDialog
        open={renewalDialogOpen}
        onOpenChange={setRenewalDialogOpen}
        subscription={selectedRenewal}
      />
    </>
  );
};
