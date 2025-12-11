import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Package, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;
type Product = Tables<"products">;

interface ConvertToClientSectionProps {
  lead: Lead;
  onConverted: () => void;
}

export const ConvertToClientSection = ({ lead, onConverted }: ConvertToClientSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const selectedProduct = products?.find(p => p.id === selectedProductId);
      if (!selectedProduct) throw new Error("Produit non trouvé");

      // Update lead status to converted - keep existing broker or assign current if none
      const updateData: { status: "converti"; product_interest: string; assigned_broker_id?: string } = {
        status: "converti" as const,
        product_interest: selectedProduct.name,
      };
      
      // Only set assigned_broker_id if not already assigned
      if (!lead.assigned_broker_id) {
        updateData.assigned_broker_id = userData.user.id;
      }

      const { error: leadError } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // Add a note about the conversion with product details
      await supabase.from("lead_notes").insert({
        lead_id: lead.id,
        broker_id: userData.user.id,
        content: `🎉 Prospect converti en client\n\nProduit sélectionné: ${selectedProduct.name}\nCatégorie: ${selectedProduct.category}\nPrime mensuelle: ${selectedProduct.base_premium.toLocaleString()} FCFA\n\n⏳ En attente de création du compte client pour finaliser la souscription.`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-notes", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["broker-clients"] });
      toast({ 
        title: "Prospect converti", 
        description: "Le prospect a été converti en client avec succès" 
      });
      onConverted();
    },
    onError: (error) => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de convertir le prospect", 
        variant: "destructive" 
      });
      console.error("Conversion error:", error);
    },
  });

  const isAlreadyConverted = lead.status === "converti";

  if (isAlreadyConverted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Prospect converti</p>
              <p className="text-sm text-emerald-600">Ce prospect est déjà un client</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          Convertir en client
        </CardTitle>
        <CardDescription className="text-xs">
          Sélectionnez un produit pour finaliser la conversion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            Produit <span className="text-destructive">*</span>
          </label>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={productsLoading ? "Chargement..." : "Sélectionner un produit"} />
            </SelectTrigger>
            <SelectContent>
              {products?.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({product.category})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          className="w-full gap-2" 
          onClick={() => convertMutation.mutate()}
          disabled={!selectedProductId || convertMutation.isPending}
        >
          {convertMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Conversion en cours...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Convertir en client
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
