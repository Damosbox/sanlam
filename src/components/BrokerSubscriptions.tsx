import { useEffect, useState, useMemo } from "react";
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
import { Eye, MoreHorizontal, Download, Send, Phone, MessageCircle, Mail, RefreshCw, Pencil, XCircle, FileEdit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PolicyDetailSheet } from "./policies/PolicyDetailSheet";
import { UnifiedFiltersBar, StatusFilterType } from "./policies/UnifiedFiltersBar";
import { ProductType } from "./broker/dashboard/ProductSelector";

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
    category?: string;
  } | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "cancelled", label: "Annulé" },
  { value: "expired", label: "Expiré" },
];

const getProductTypeFromCategory = (category?: string): ProductType => {
  if (!category) return "all";
  const categoryMap: Record<string, ProductType> = {
    "auto": "auto",
    "automobile": "auto",
    "mrh": "mrh",
    "habitation": "mrh",
    "sante": "sante",
    "santé": "sante",
    "vie": "vie",
    "epargne": "vie",
    "épargne": "vie",
    "obseques": "obseques",
    "obsèques": "obseques",
  };
  return categoryMap[category.toLowerCase()] || "all";
};

export const BrokerSubscriptions = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<Subscription | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Filters state
  const [searchValue, setSearchValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");

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
            name,
            category
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

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const matchesSearch = 
          sub.profiles?.display_name?.toLowerCase().includes(search) ||
          sub.profiles?.email?.toLowerCase().includes(search) ||
          sub.policy_number.toLowerCase().includes(search) ||
          sub.products?.name?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Product filter
      if (selectedProduct !== "all") {
        const productType = getProductTypeFromCategory(sub.products?.category);
        if (productType !== selectedProduct) return false;
      }
      
      // Status filter
      if (statusFilter !== "all" && sub.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [subscriptions, searchValue, selectedProduct, statusFilter]);

  // Product counts for filter badges
  const productCounts = useMemo(() => {
    const counts: Partial<Record<ProductType, number>> = { all: subscriptions.length };
    subscriptions.forEach((sub) => {
      const type = getProductTypeFromCategory(sub.products?.category);
      if (type !== "all") {
        counts[type] = (counts[type] || 0) + 1;
      }
    });
    return counts;
  }, [subscriptions]);

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

  const handleRenew = (policy: Subscription) => {
    toast({
      title: "Renouvellement initié",
      description: `Demande de renouvellement pour la police ${policy.policy_number}`,
    });
  };

  const handleModify = (policy: Subscription) => {
    toast({
      title: "Modification de police",
      description: `Ouverture de l'avenant pour ${policy.policy_number}`,
    });
  };

  const handleTerminate = (policy: Subscription) => {
    toast({
      title: "Résiliation demandée",
      description: `Demande de résiliation pour la police ${policy.policy_number}`,
    });
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <UnifiedFiltersBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Rechercher par client, email, n° police..."
        selectedProduct={selectedProduct}
        onProductChange={setSelectedProduct}
        productCounts={productCounts}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => setStatusFilter(val as StatusFilterType)}
        statusOptions={STATUS_OPTIONS}
        statusLabel="Statut"
        totalCount={subscriptions.length}
        filteredCount={filteredSubscriptions.length}
        showProductFilter={true}
        showStatusFilter={true}
      />

      {/* Table */}
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
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucune souscription assignée
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((sub) => (
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
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRenew(sub)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Renouveler
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleModify(sub)}>
                            <FileEdit className="mr-2 h-4 w-4" />
                            Modifier / Avenant
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleTerminate(sub)} className="text-destructive focus:text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Résilier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
      </div>
    );
};
