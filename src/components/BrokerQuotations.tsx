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
import { FileText, User, Phone, Mail, Eye } from "lucide-react";
import { UnifiedFiltersBar } from "./policies/UnifiedFiltersBar";
import { ProductType } from "./broker/dashboard/ProductSelector";
import { QuotationDetailDialog } from "./policies/QuotationDetailDialog";

// Unified quotation interface
interface UnifiedQuotation {
  id: string;
  source: "legacy" | "quotations";
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  productType: string;
  productName: string;
  premiumAmount: number | null;
  status: "pending" | "converted" | "expired" | "cancelled";
  paymentStatus: string;
  createdAt: string;
  validUntil: string | null;
  leadId: string | null;
  leadStatus: string | null;
  coverageDetails: any;
}

type QuotationStatusFilter = "all" | "pending" | "converted" | "expired";

const LEAD_STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En cours" },
  { value: "converted", label: "Converti" },
  { value: "expired", label: "Expiré" },
];

const getProductTypeFromInterest = (interest?: string | null): ProductType => {
  if (!interest) return "all";
  const interestLower = interest.toLowerCase();
  if (interestLower.includes("auto")) return "auto";
  if (interestLower.includes("obsèques") || interestLower.includes("obseques")) return "obseques";
  return "all";
};

const mapProductType = (type: string): ProductType => {
  const mapping: Record<string, ProductType> = {
    auto: "auto",
    pack_obseques: "obseques",
    obseques: "obseques",
  };
  return mapping[type.toLowerCase()] || "all";
};

const getQuotationStatus = (paymentStatus: string, validUntil: string | null): "pending" | "converted" | "expired" | "cancelled" => {
  if (paymentStatus === "paid") return "converted";
  if (paymentStatus === "cancelled") return "cancelled";
  if (validUntil && new Date(validUntil) < new Date()) return "expired";
  return "pending";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "converted":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Converti</Badge>;
    case "expired":
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">Expiré</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Annulé</Badge>;
    case "pending":
    default:
      return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">En cours</Badge>;
  }
};

export const BrokerQuotations = () => {
  // Filters state
  const [searchValue, setSearchValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [statusFilter, setStatusFilter] = useState<QuotationStatusFilter>("all");
  const [selectedQuotation, setSelectedQuotation] = useState<UnifiedQuotation | null>(null);

  // Fetch quotations from the quotations table
  const { data: quotationsData = [], isLoading: loadingQuotations } = useQuery({
    queryKey: ["broker-quotations-table"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("quotations")
        .select(`
          id,
          broker_id,
          lead_id,
          product_type,
          product_name,
          premium_amount,
          premium_frequency,
          payment_status,
          valid_until,
          coverage_details,
          created_at,
          leads (
            id,
            first_name,
            last_name,
            email,
            phone,
            status
          )
        `)
        .eq("broker_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quotations:", error);
        return [];
      }

      return (data || []).map((q: any): UnifiedQuotation => ({
        id: q.id,
        source: "quotations",
        clientName: q.leads ? `${q.leads.first_name} ${q.leads.last_name}` : (q.coverage_details?.clientInfo?.firstName && q.coverage_details?.clientInfo?.lastName ? `${q.coverage_details.clientInfo.firstName} ${q.coverage_details.clientInfo.lastName}` : "Client non renseigné"),
        clientEmail: q.leads?.email || q.coverage_details?.clientInfo?.email || null,
        clientPhone: q.leads?.phone || q.coverage_details?.clientInfo?.phone || null,
        productType: q.product_type,
        productName: q.product_name,
        premiumAmount: q.premium_amount,
        status: getQuotationStatus(q.payment_status, q.valid_until),
        paymentStatus: q.payment_status,
        createdAt: q.created_at,
        validUntil: q.valid_until,
        leadId: q.lead_id,
        leadStatus: q.leads?.status || null,
        coverageDetails: q.coverage_details
      }));
    }
  });

  // Fetch legacy quotations from lead_notes
  const { data: legacyQuotations = [], isLoading: loadingLegacy } = useQuery({
    queryKey: ["broker-quotations-legacy"],
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
        console.error("Error fetching legacy quotations:", error);
        return [];
      }

      return (data || []).map((item: any): UnifiedQuotation => {
        const lead = item.leads;
        // Parse content to extract product and premium
        const productMatch = item.content.match(/\[DEVIS\]\s*(.+?)(?:\s*-|$)/);
        const premiumMatch = item.content.match(/(\d[\d\s]*)\s*FCFA/);
        const productName = productMatch ? productMatch[1].trim() : "Devis";
        const premium = premiumMatch ? parseInt(premiumMatch[1].replace(/\s/g, "")) : null;

        return {
          id: item.id,
          source: "legacy",
          clientName: lead ? `${lead.first_name} ${lead.last_name}` : "N/A",
          clientEmail: lead?.email || null,
          clientPhone: lead?.phone || null,
          productType: lead?.product_interest || "",
          productName,
          premiumAmount: premium,
          status: lead?.status === "converti" ? "converted" : "pending",
          paymentStatus: lead?.status === "converti" ? "paid" : "pending_payment",
          createdAt: item.created_at,
          validUntil: null,
          leadId: item.lead_id,
          leadStatus: lead?.status || null,
          coverageDetails: { rawContent: item.content }
        };
      });
    }
  });

  const isLoading = loadingQuotations || loadingLegacy;

  // Merge and deduplicate quotations (prefer quotations table over legacy)
  const allQuotations = useMemo(() => {
    const quotationsMap = new Map<string, UnifiedQuotation>();
    
    // Add quotations table data first (higher priority)
    quotationsData.forEach(q => quotationsMap.set(q.id, q));
    
    // Add legacy data (only if not already present by lead_id match)
    legacyQuotations.forEach(q => {
      const isDuplicate = quotationsData.some(
        qd => qd.leadId && qd.leadId === q.leadId && 
              qd.productName.toLowerCase().includes(q.productName.toLowerCase().slice(0, 5))
      );
      if (!isDuplicate) {
        quotationsMap.set(q.id, q);
      }
    });

    // Sort by date descending
    return Array.from(quotationsMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [quotationsData, legacyQuotations]);

  // Filtered quotations
  const filteredQuotations = useMemo(() => {
    return allQuotations.filter((quote) => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const matchesSearch = 
          quote.clientName.toLowerCase().includes(search) ||
          quote.clientEmail?.toLowerCase().includes(search) ||
          quote.clientPhone?.includes(search) ||
          quote.productName.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Product filter
      if (selectedProduct !== "all") {
        const productType = quote.source === "quotations" 
          ? mapProductType(quote.productType)
          : getProductTypeFromInterest(quote.productType);
        if (productType !== selectedProduct) return false;
      }
      
      // Status filter
      if (statusFilter !== "all" && quote.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [allQuotations, searchValue, selectedProduct, statusFilter]);

  // Product counts
  const productCounts = useMemo(() => {
    const counts: Partial<Record<ProductType, number>> = { all: allQuotations.length };
    allQuotations.forEach((quote) => {
      const type = quote.source === "quotations" 
        ? mapProductType(quote.productType)
        : getProductTypeFromInterest(quote.productType);
      if (type !== "all") {
        counts[type] = (counts[type] || 0) + 1;
      }
    });
    return counts;
  }, [allQuotations]);

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <UnifiedFiltersBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Rechercher par client, email, téléphone, produit..."
        selectedProduct={selectedProduct}
        onProductChange={setSelectedProduct}
        productCounts={productCounts}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => setStatusFilter(val as QuotationStatusFilter)}
        statusOptions={LEAD_STATUS_OPTIONS}
        statusLabel="Statut devis"
        totalCount={allQuotations.length}
        filteredCount={filteredQuotations.length}
        showProductFilter={true}
        showStatusFilter={true}
      />

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Client</TableHead>
              <TableHead className="min-w-[120px]">Produit</TableHead>
              <TableHead className="min-w-[100px]">Prime</TableHead>
              <TableHead className="min-w-[100px]">Date</TableHead>
              <TableHead className="min-w-[90px]">Validité</TableHead>
              <TableHead className="min-w-[100px]">Statut</TableHead>
              <TableHead className="min-w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                        {quote.clientName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                        {quote.clientEmail || quote.clientPhone || "—"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {quote.productName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {quote.premiumAmount ? (
                      <span className="font-medium">{quote.premiumAmount.toLocaleString()} FCFA</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(quote.createdAt), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {quote.validUntil ? (
                      <span className={new Date(quote.validUntil) < new Date() ? "text-muted-foreground" : ""}>
                        {format(new Date(quote.validUntil), "dd/MM/yy", { locale: fr })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(quote.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedQuotation(quote)}
                        title="Consulter"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {quote.clientPhone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(`tel:${quote.clientPhone}`, "_blank")}
                          title="Appeler"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      {quote.clientEmail && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.location.href = `mailto:${quote.clientEmail}`}
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

      {/* Quotation Detail Dialog */}
      {selectedQuotation && (
        <QuotationDetailDialog
          quotation={{
            id: selectedQuotation.id,
            lead_id: selectedQuotation.leadId,
            product_type: selectedQuotation.productType,
            product_name: selectedQuotation.productName,
            premium_amount: selectedQuotation.premiumAmount || 0,
            premium_frequency: "annuel",
            payment_status: selectedQuotation.paymentStatus,
            payment_link: null,
            valid_until: selectedQuotation.validUntil,
            created_at: selectedQuotation.createdAt,
            coverage_details: selectedQuotation.coverageDetails,
            leads: selectedQuotation.clientName !== "Client non renseigné" && selectedQuotation.clientName !== "N/A" ? {
              first_name: selectedQuotation.clientName.split(" ")[0] || "",
              last_name: selectedQuotation.clientName.split(" ").slice(1).join(" ") || "",
              email: selectedQuotation.clientEmail,
              phone: selectedQuotation.clientPhone,
            } : null
          }}
          open={!!selectedQuotation}
          onOpenChange={(open) => !open && setSelectedQuotation(null)}
        />
      )}
    </div>
  );
};
