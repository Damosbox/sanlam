import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Share2, FolderOpen, ArrowLeft, Send, Download, Home, Heart, Car } from "lucide-react";
import { GuidedSalesState } from "../types";
import { toast } from "sonner";
import { DocumentResendDialog } from "@/components/policies/DocumentResendDialog";
import { useNavigate } from "react-router-dom";

interface IssuanceStepProps {
  state: GuidedSalesState;
  onReset: () => void;
  upsellAccepted?: boolean;
}

export const IssuanceStep = ({ state, onReset, upsellAccepted }: IssuanceStepProps) => {
  const navigate = useNavigate();
  const policyNumber = state.finalizedPolicyNumber || ("POL-2024-CI-" + Math.random().toString(36).substring(2, 8).toUpperCase());
  
  // Document resend dialog state
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [selectedDocsForResend, setSelectedDocsForResend] = useState<any[]>([]);

  const isPackObseques = state.productSelection?.selectedProduct === "pack_obseques";
  const currentProduct = state.productSelection?.selectedProduct;

  // Mock documents for the issued policy
  const mockDocuments = isPackObseques ? [
    { id: "doc-1", document_name: "Reçu de paiement", document_type: "facture", file_url: null },
    { id: "doc-2", document_name: "Certificat d'adhésion", document_type: "attestation", file_url: null },
    { id: "doc-3", document_name: "Conditions Particulières (CP)", document_type: "attestation", file_url: null },
    { id: "doc-4", document_name: "Conditions générales", document_type: "conditions_generales", file_url: null },
  ] : [
    { id: "doc-1", document_name: "Reçu de paiement", document_type: "facture", file_url: null },
    { id: "doc-2", document_name: "Conditions Particulières (CP)", document_type: "attestation", file_url: null },
    { id: "doc-3", document_name: "Attestation d'assurance", document_type: "attestation", file_url: null },
    { id: "doc-4", document_name: "Conditions générales", document_type: "conditions_generales", file_url: null },
  ];

  // Cross-selling products based on current product
  const crossSellProducts = currentProduct === "pack_obseques" ? [
    {
      id: "auto",
      name: "Assurance Auto",
      description: "Protégez votre véhicule avec une couverture adaptée à vos besoins.",
      priceFrom: "45 000 FCFA/an",
      icon: Car,
      product: "auto",
    },
    {
      id: "habitation",
      name: "Assurance Habitation",
      description: "Sécurisez votre logement et vos biens contre les risques du quotidien.",
      priceFrom: "35 000 FCFA/an",
      icon: Home,
      product: "habitation",
    },
  ] : [
    {
      id: "habitation",
      name: "Assurance Habitation",
      description: "Sécurisez votre logement et vos biens contre les risques du quotidien.",
      priceFrom: "35 000 FCFA/an",
      icon: Home,
      product: "habitation",
    },
    {
      id: "pack_obseques",
      name: "Pack Obsèques",
      description: "Anticipez et protégez vos proches avec une couverture obsèques complète.",
      priceFrom: "5 000 FCFA/mois",
      icon: Heart,
      product: "pack_obseques",
    },
  ];

  const handleResendAll = () => {
    setSelectedDocsForResend(mockDocuments);
    setResendDialogOpen(true);
  };

  const handleResendOne = (doc: any) => {
    setSelectedDocsForResend([doc]);
    setResendDialogOpen(true);
  };

  const handleDownloadAll = () => {
    toast.info("Téléchargement du dossier complet...");
  };

  const handleCrossSell = (product: string) => {
    navigate(`/broker/guided-sales?product=${product}`);
  };

  return (
    <div className="space-y-6">
      {/* Document Resend Dialog */}
      <DocumentResendDialog
        open={resendDialogOpen}
        onOpenChange={setResendDialogOpen}
        documents={selectedDocsForResend}
        clientEmail={state.binding?.clientEmail || state.clientIdentification?.email}
        clientPhone={state.binding?.clientPhone || state.clientIdentification?.phone}
        policyNumber={policyNumber}
        subscriptionId={state.finalizedSubscriptionId || "mock-subscription-id"}
      />

      <div className="text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white mb-4">
          Police émise
        </Badge>
        <h1 className="text-2xl font-bold text-foreground">Félicitations !</h1>
        <p className="text-muted-foreground mt-1">
          Le contrat a été émis avec succès.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Numéro de police</p>
          <p className="text-2xl font-mono font-bold text-foreground">{policyNumber}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Documents disponibles</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleResendAll}>
                <Send className="h-4 w-4" />
                Renvoyer tout
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadAll}>
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {mockDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{doc.document_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleResendOne(doc)}>
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toast.info("Téléchargement...")}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Badge variant="secondary">PDF</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cross-selling */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-1">Découvrez nos autres produits</h3>
          <p className="text-sm text-muted-foreground mb-4">Complétez la protection de votre client</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {crossSellProducts.map((product) => {
              const Icon = product.icon;
              return (
                <div key={product.id} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">À partir de {product.priceFrom}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleCrossSell(product.product)}>
                    En savoir plus
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Partager au client
        </Button>
        <Button variant="outline" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Espace documents
        </Button>
        <Button variant="secondary" className="gap-2" onClick={onReset}>
          <ArrowLeft className="h-4 w-4" />
          Nouveau devis
        </Button>
      </div>
    </div>
  );
};

