import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, User, Phone, Mail } from "lucide-react";
import { UnifiedFiltersBar, LeadStatusFilterType } from "./policies/UnifiedFiltersBar";
import { ProductType } from "./broker/dashboard/ProductSelector";

interface Quotation {
  id: string;
  content: string;
  created_at: string;
  lead_id: string;
  lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    product_interest: string | null;
    status: string;
  } | null;
}

const LEAD_STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "nouveau", label: "Nouveau" },
  { value: "en_cours", label: "En cours" },
  { value: "relance", label: "Relance" },
  { value: "converti", label: "Converti" },
  { value: "perdu", label: "Perdu" },
];

const getProductTypeFromInterest = (interest?: string | null): ProductType => {
  if (!interest) return "all";
  const interestLower = interest.toLowerCase();
  if (interestLower.includes("auto")) return "auto";
  if (interestLower.includes("mrh") || interestLower.includes("habitation")) return "mrh";
  if (interestLower.includes("santé") || interestLower.includes("sante")) return "sante";
  if (interestLower.includes("vie") || interestLower.includes("épargne") || interestLower.includes("epargne")) return "vie";
  if (interestLower.includes("obsèques") || interestLower.includes("obseques")) return "obseques";
  return "all";
};

export const BrokerQuotations = () => {
  // Filters state
  const [searchValue, setSearchValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilterType>("all");

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["broker-quotations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("lead_notes")
        .select(`
          id,
          content,
          created_at,
          lead_id,
          leads!lead_notes_lead_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone,
            product_interest,
            status
          )
        `)
        .eq("broker_id", user.id)
        .ilike("content", "%[DEVIS]%")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quotations:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        lead: item.leads
      })) as Quotation[];
    }
  });

  // Filtered quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((quote) => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const fullName = quote.lead ? `${quote.lead.first_name} ${quote.lead.last_name}`.toLowerCase() : "";
        const matchesSearch = 
          fullName.includes(search) ||
          quote.lead?.email?.toLowerCase().includes(search) ||
          quote.lead?.phone?.includes(search) ||
          quote.content.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Product filter
      if (selectedProduct !== "all") {
        const productType = getProductTypeFromInterest(quote.lead?.product_interest);
        if (productType !== selectedProduct) return false;
      }
      
      // Status filter
      if (statusFilter !== "all" && quote.lead?.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [quotations, searchValue, selectedProduct, statusFilter]);

  // Product counts
  const productCounts = useMemo(() => {
    const counts: Partial<Record<ProductType, number>> = { all: quotations.length };
    quotations.forEach((quote) => {
      const type = getProductTypeFromInterest(quote.lead?.product_interest);
      if (type !== "all") {
        counts[type] = (counts[type] || 0) + 1;
      }
    });
    return counts;
  }, [quotations]);

  const parseQuoteContent = (content: string) => {
    // Extract product name from content like "[DEVIS] Product Name - Details"
    const match = content.match(/\[DEVIS\]\s*(.+?)(?:\s*-|$)/);
    return match ? match[1].trim() : content.replace("[DEVIS]", "").trim();
  };

  const extractPremium = (content: string) => {
    // Try to extract premium from content
    const match = content.match(/(\d[\d\s]*)\s*FCFA/);
    return match ? match[1].replace(/\s/g, "") : null;
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <UnifiedFiltersBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Rechercher par prospect, email, téléphone..."
        selectedProduct={selectedProduct}
        onProductChange={setSelectedProduct}
        productCounts={productCounts}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => setStatusFilter(val as LeadStatusFilterType)}
        statusOptions={LEAD_STATUS_OPTIONS}
        statusLabel="Statut lead"
        totalCount={quotations.length}
        filteredCount={filteredQuotations.length}
        showProductFilter={true}
        showStatusFilter={true}
      />

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Prospect</TableHead>
              <TableHead className="min-w-[120px]">Produit</TableHead>
              <TableHead className="min-w-[100px] hidden sm:table-cell">Prime estimée</TableHead>
              <TableHead className="min-w-[100px]">Date</TableHead>
              <TableHead className="min-w-[100px]">Statut lead</TableHead>
              <TableHead className="min-w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {searchValue || selectedProduct !== "all" || statusFilter !== "all" 
                    ? "Aucune cotation trouvée pour ces filtres"
                    : "Aucune cotation enregistrée"
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {quote.lead ? `${quote.lead.first_name} ${quote.lead.last_name}` : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                      {quote.lead?.email || quote.lead?.phone || "—"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {parseQuoteContent(quote.content)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
                  {extractPremium(quote.content) ? (
                    <span className="font-medium">{Number(extractPremium(quote.content)).toLocaleString()} FCFA</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(quote.created_at), "dd MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  {quote.lead?.status && (
                    <Badge 
                      variant={quote.lead.status === "converti" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {quote.lead.status === "nouveau" && "Nouveau"}
                      {quote.lead.status === "en_cours" && "En cours"}
                      {quote.lead.status === "relance" && "Relance"}
                      {quote.lead.status === "converti" && "Converti"}
                      {quote.lead.status === "perdu" && "Perdu"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {quote.lead?.phone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(`tel:${quote.lead?.phone}`, "_blank")}
                        title="Appeler"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    {quote.lead?.email && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.location.href = `mailto:${quote.lead?.email}`}
                        title="Email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
