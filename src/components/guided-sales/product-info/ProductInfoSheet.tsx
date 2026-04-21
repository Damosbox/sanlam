import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Shield, FileText, HelpCircle, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Coverage = { id?: string; label: string; name?: string; description?: string; required?: boolean };
type Faq = { q?: string; a?: string; question?: string; answer?: string };
type DocTpl = { id?: string; name?: string; title?: string };

/**
 * Parse exclusions from free-text `terms` field.
 * Looks for a block starting with "Exclusions" / "Ne sont pas couverts" and
 * extracts the following bullet/line items.
 */
const parseExclusionsFromTerms = (terms: string | null | undefined): string[] => {
  if (!terms) return [];
  const lines = terms.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const startIdx = lines.findIndex((l) =>
    /^(exclusions?|ne sont pas couverts?|ce qui n'est pas couvert)/i.test(l)
  );
  if (startIdx === -1) return [];
  const items: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop at next section header
    if (/^[A-ZÉÈÀ][^.]{0,80}:$/.test(line) && !line.startsWith("-") && !line.startsWith("•")) break;
    const cleaned = line.replace(/^[-•*–]\s*/, "").trim();
    if (cleaned) items.push(cleaned);
  }
  return items;
};

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
        .select("id, name, description, category, coverages, faqs, terms, document_templates")
        .eq("product_type", productType!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!open) return null;

  const coverages: Coverage[] = Array.isArray(product?.coverages) ? (product!.coverages as Coverage[]) : [];
  const faqsRaw: Faq[] = Array.isArray(product?.faqs) ? (product!.faqs as Faq[]) : [];
  const docsRaw: DocTpl[] = Array.isArray(product?.document_templates) ? (product!.document_templates as DocTpl[]) : [];
  const exclusions = parseExclusionsFromTerms(product?.terms);
  // Highlights = required coverages (auto-derived from the product engine)
  const highlights = coverages.filter((c) => c.required).map((c) => c.label || c.name || "").filter(Boolean);
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
          {highlights.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Garanties incluses
              </h3>
              <ul className="space-y-1.5">
                {highlights.map((h, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          )}

          <Tabs defaultValue="guarantees" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="guarantees"><Shield className="h-3.5 w-3.5 mr-1" />Garanties</TabsTrigger>
              <TabsTrigger value="exclusions"><X className="h-3.5 w-3.5 mr-1" />Exclusions</TabsTrigger>
              <TabsTrigger value="faq"><HelpCircle className="h-3.5 w-3.5 mr-1" />FAQ</TabsTrigger>
              <TabsTrigger value="docs"><FileText className="h-3.5 w-3.5 mr-1" />Docs</TabsTrigger>
            </TabsList>

            <TabsContent value="guarantees" className="space-y-2 mt-4">
              {coverages.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Aucune garantie configurée pour ce produit.
                </p>
              ) : (
                coverages.map((g, i) => {
                  const name = g.label || g.name || "—";
                  return (
                    <div key={g.id ?? i} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-1.5 rounded-full mt-0.5 bg-emerald-500/10">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {name}
                          {g.required && <Badge variant="outline" className="text-[10px]">Obligatoire</Badge>}
                        </div>
                        {g.description && <div className="text-xs text-muted-foreground mt-0.5">{g.description}</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="exclusions" className="mt-4">
              {exclusions.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Aucune exclusion renseignée. Consultez les Conditions Générales du produit.
                </p>
              ) : (
                <ul className="space-y-2">
                  {exclusions.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="faq" className="mt-4">
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
            </TabsContent>

            <TabsContent value="docs" className="space-y-2 mt-4">
              {docsRaw.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Aucun document associé à ce produit.
                </p>
              ) : (
                docsRaw.map((d, i) => {
                  const label = d.name || d.title || `Document ${i + 1}`;
                  return (
                    <div key={d.id ?? i} className="w-full flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm flex-1">{label}</span>
                      <Badge variant="outline" className="text-xs">PDF</Badge>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>

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