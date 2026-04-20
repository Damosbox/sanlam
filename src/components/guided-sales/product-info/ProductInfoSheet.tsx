import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Shield, FileText, HelpCircle, Sparkles } from "lucide-react";

interface ProductInfo {
  name: string;
  description: string;
  category: string;
  guarantees: { name: string; included: boolean; description?: string }[];
  exclusions: string[];
  faqs: { q: string; a: string }[];
  highlights: string[];
  documents: string[];
}

const PRODUCT_DATA: Record<string, ProductInfo> = {
  auto: {
    name: "Assurance Auto",
    description: "Couverture complète pour véhicules particuliers et professionnels en Côte d'Ivoire, conforme aux exigences ASACI et CIMA.",
    category: "Non-Vie",
    highlights: [
      "5 formules adaptées (Tiers Simple à Tous Risques)",
      "Attestation jaune ASACI dématérialisée",
      "Assistance dépannage 24/7 incluse selon formule",
      "Indemnisation accélérée < 30 jours",
    ],
    guarantees: [
      { name: "Responsabilité Civile", included: true, description: "Dommages causés aux tiers (obligatoire)" },
      { name: "Défense Recours", included: true, description: "Protection juridique en cas de litige" },
      { name: "Vol & Incendie", included: true, description: "À partir de la formule Tiers Complet" },
      { name: "Bris de glace", included: true },
      { name: "Dommages Tous Accidents", included: true, description: "Formule Tous Risques uniquement" },
      { name: "Assistance 0 km", included: true, description: "Dépannage depuis le domicile" },
      { name: "Conducteur (corporel)", included: true, description: "Indemnisation du conducteur responsable" },
    ],
    exclusions: [
      "Conduite sous emprise d'alcool ou stupéfiants",
      "Défaut de permis valide",
      "Compétitions sportives non déclarées",
      "Transport de matières dangereuses sans déclaration",
      "Sinistres antérieurs à la souscription",
    ],
    faqs: [
      { q: "Quel est le délai de carence ?", a: "Aucun délai de carence — la couverture débute à la prise d'effet de la police." },
      { q: "Comment déclarer un sinistre ?", a: "Via l'application mobile, le portail web, ou par téléphone au centre de gestion sous 5 jours ouvrés." },
      { q: "Bonus / Malus ?", a: "Système CRM CIMA : -5% par année sans sinistre (plancher 0,50), +25% par sinistre responsable (plafond 3,50)." },
      { q: "Puis-je résilier à tout moment ?", a: "Oui, après 1 an d'engagement (loi Hamon CI), avec préavis de 1 mois." },
    ],
    documents: ["Conditions Générales Auto", "Tableau des garanties", "Liste des exclusions", "Procédure sinistre"],
  },
  pack_obseques: {
    name: "Pack Obsèques",
    description: "Garantie le versement d'un capital défini en cas de décès pour couvrir les frais funéraires et soulager les proches.",
    category: "Vie",
    highlights: [
      "Capital garanti versé sous 72h",
      "Pas de questionnaire médical < 60 ans",
      "Cotisation viagère ou temporaire",
      "Bénéficiaires libres avec clauses-types",
    ],
    guarantees: [
      { name: "Capital décès", included: true, description: "De 500 000 à 5 000 000 FCFA selon formule" },
      { name: "Décès accidentel — capital doublé", included: true },
      { name: "Prise en charge totale frais obsèques", included: true, description: "Inhumation, crémation, transport corps" },
      { name: "Assistance famille (psychologue)", included: true },
      { name: "Conseil juridique succession", included: true },
      { name: "Rapatriement de corps international", included: true, description: "Formule Premium" },
    ],
    exclusions: [
      "Suicide durant la 1ʳᵉ année (sauf accidentel)",
      "Décès résultant d'un acte intentionnel du bénéficiaire",
      "Guerre ou insurrection (sauf clause spécifique)",
      "Sports extrêmes non déclarés",
    ],
    faqs: [
      { q: "Faut-il un examen médical ?", a: "Non pour les souscripteurs < 60 ans avec capital ≤ 2 000 000 FCFA. Au-delà, questionnaire simple." },
      { q: "Quand le capital est-il versé ?", a: "Sous 72h après réception de l'acte de décès et de la pièce d'identité du bénéficiaire." },
      { q: "Puis-je modifier les bénéficiaires ?", a: "Oui, à tout moment via le portail ou en agence, par avenant signé." },
      { q: "Quelle est la durée minimale ?", a: "La police est renouvelable annuellement, sans durée minimale d'engagement après la 1ʳᵉ année." },
    ],
    documents: ["Notice d'information", "Conditions Générales Vie", "Clause bénéficiaire-type", "Tableau des cotisations"],
  },
};

interface ProductInfoSheetProps {
  open: boolean;
  onClose: () => void;
  productType: string | null;
  onSelect?: () => void;
}

export const ProductInfoSheet = ({ open, onClose, productType, onSelect }: ProductInfoSheetProps) => {
  const product = productType ? PRODUCT_DATA[productType] : null;
  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{product.category}</Badge>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Conforme CIMA
            </Badge>
          </div>
          <SheetTitle className="text-2xl">{product.name}</SheetTitle>
          <SheetDescription className="text-base">{product.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Points forts
              </h3>
              <ul className="space-y-1.5">
                {product.highlights.map((h, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Tabs defaultValue="guarantees" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="guarantees"><Shield className="h-3.5 w-3.5 mr-1" />Garanties</TabsTrigger>
              <TabsTrigger value="exclusions"><X className="h-3.5 w-3.5 mr-1" />Exclusions</TabsTrigger>
              <TabsTrigger value="faq"><HelpCircle className="h-3.5 w-3.5 mr-1" />FAQ</TabsTrigger>
              <TabsTrigger value="docs"><FileText className="h-3.5 w-3.5 mr-1" />Docs</TabsTrigger>
            </TabsList>

            <TabsContent value="guarantees" className="space-y-2 mt-4">
              {product.guarantees.map((g, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`p-1.5 rounded-full mt-0.5 ${g.included ? "bg-emerald-500/10" : "bg-muted"}`}>
                    {g.included ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{g.name}</div>
                    {g.description && <div className="text-xs text-muted-foreground mt-0.5">{g.description}</div>}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="exclusions" className="mt-4">
              <ul className="space-y-2">
                {product.exclusions.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="faq" className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                {product.faqs.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="docs" className="space-y-2 mt-4">
              {product.documents.map((d, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors text-left">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm flex-1">{d}</span>
                  <Badge variant="outline" className="text-xs">PDF</Badge>
                </button>
              ))}
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
      </SheetContent>
    </Sheet>
  );
};