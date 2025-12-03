import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;
type Product = Tables<"products">;

interface QuickQuoteDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (leadId: string, status: Lead["status"]) => void;
}

export const QuickQuoteDialog = ({ lead, open, onOpenChange, onStatusChange }: QuickQuoteDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");

  const { data: products } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });

  useEffect(() => {
    if (open && lead?.product_interest && products) {
      const matchingProduct = products.find(
        (p) => p.category.toLowerCase().includes(lead.product_interest?.toLowerCase() || "") ||
               p.name.toLowerCase().includes(lead.product_interest?.toLowerCase() || "")
      );
      if (matchingProduct) {
        setSelectedProductId(matchingProduct.id);
      }
    }
    if (!open) {
      setSelectedProductId("");
      setQuoteNotes("");
    }
  }, [open, lead, products]);

  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  const handleCreateQuote = async () => {
    if (!lead || !selectedProduct) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un produit", variant: "destructive" });
      return;
    }

    const quoteData = {
      client: `${lead.first_name} ${lead.last_name}`,
      product: selectedProduct.name,
      category: selectedProduct.category,
      basePremium: selectedProduct.base_premium,
      date: format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr }),
    };

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from("lead_notes").insert({
        lead_id: lead.id,
        broker_id: userData.user.id,
        content: `📋 DEVIS RAPIDE\n\nProduit: ${quoteData.product} (${quoteData.category})\nPrime de base: ${quoteData.basePremium.toLocaleString()} FCFA/mois\nDate: ${quoteData.date}${quoteNotes ? `\n\nNotes: ${quoteNotes}` : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["lead-notes", lead.id] });
    }

    onStatusChange(lead.id, "en_cours");
    toast({ title: "Devis créé", description: `Devis pour ${quoteData.product}` });
    onOpenChange(false);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Calculator className="h-5 w-5" />
            Devis Rapide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Client Info */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-muted-foreground" />
              Client
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Nom</p>
                <p className="font-medium">{lead.first_name} {lead.last_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="font-medium">{lead.email || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Téléphone</p>
                <p className="font-medium">{lead.phone || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Intérêt</p>
                <p className="font-medium">{lead.product_interest || "—"}</p>
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Sélectionner un produit</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un produit..." />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      <span>{product.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Product */}
          {selectedProduct && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-primary">{selectedProduct.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{selectedProduct.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary/10">
                <span className="text-sm">Prime de base</span>
                <span className="text-lg font-bold text-primary">
                  {selectedProduct.base_premium.toLocaleString()} FCFA/mois
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              placeholder="Notes personnalisées..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateQuote} disabled={!selectedProductId} className="gap-2">
              <FileText className="h-4 w-4" />
              Créer le devis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
