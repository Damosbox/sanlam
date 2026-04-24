import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Faq = { q?: string; a?: string; question?: string; answer?: string };

interface ProductInfoSheetProps {
  open: boolean;
  onClose: () => void;
  productType: string | null;
  onSelect?: () => void;
}

export const ProductInfoSheet = ({ open, onClose, productType, onSelect }: ProductInfoSheetProps) => {
  const { data: product, isLoading } = useQuery({
    queryKey: ["product-info-sheet", productType],
    enabled: !!productType && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, category, faqs")
        .eq("product_type", productType!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!open) return null;

  const faqsRaw: Faq[] = Array.isArray(product?.faqs) ? (product!.faqs as Faq[]) : [];
  const categoryLabel = product?.category === "vie" ? "Vie" : product?.category === "non-vie" ? "Non-Vie" : product?.category ?? "";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {isLoading || !product ? (
          <div className="space-y-4 mt-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
        <>
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-2">
            {categoryLabel && <Badge variant="secondary">{categoryLabel}</Badge>}
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Conforme CIMA
            </Badge>
          </div>
          <SheetTitle className="text-2xl">{product.name}</SheetTitle>
          {product.description && (
            <SheetDescription className="text-base">{product.description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-3">Questions fréquentes</h3>
            {faqsRaw.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                Aucune question fréquente renseignée pour ce produit.
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {faqsRaw.map((f, i) => {
                  const q = f.q || f.question || "";
                  const a = f.a || f.answer || "";
                  if (!q) return null;
                  return (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-left text-sm">{q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>

          {onSelect && (
            <div className="sticky bottom-0 bg-background pt-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Fermer</Button>
              <Button className="flex-1" onClick={() => { onSelect(); onClose(); }}>
                Démarrer le devis
              </Button>
            </div>
          )}
        </div>
        </>
        )}
      </SheetContent>
    </Sheet>
  );
};