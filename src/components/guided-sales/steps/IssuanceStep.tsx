import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Share2, FolderOpen, ArrowLeft, Send, Download } from "lucide-react";
import { GuidedSalesState } from "../types";
import { toast } from "sonner";
import { UpsellModal } from "./UpsellModal";
import { DocumentResendDialog } from "@/components/policies/DocumentResendDialog";

interface IssuanceStepProps {
  state: GuidedSalesState;
  onReset: () => void;
}

export const IssuanceStep = ({ state, onReset }: IssuanceStepProps) => {
  const policyNumber = state.finalizedPolicyNumber || ("POL-2024-CI-" + Math.random().toString(36).substring(2, 8).toUpperCase());
  
  // Upsell modal state
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upsellAccepted, setUpsellAccepted] = useState(false);
  
  
  // Document resend dialog state
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [selectedDocsForResend, setSelectedDocsForResend] = useState<any[]>([]);

  const isPackObseques = state.productSelection?.selectedProduct === "pack_obseques";

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

  // Show upsell modal automatically after a short delay (simulating post-payment webhook)
  useEffect(() => {
    if (!upsellAccepted) {
      const timer = setTimeout(() => {
        setShowUpsellModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [upsellAccepted]);

  const handleUpsellClose = () => {
    setShowUpsellModal(false);
  };

  const handleUpsellAccept = (offerId: string) => {
    setShowUpsellModal(false);
    setUpsellAccepted(true);
    // Here you would typically send the upsell acceptance to your backend
    console.log("Upsell accepted:", offerId);
  };


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
    // In a real implementation, this would trigger a ZIP download
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

      {/* Upsell Modal */}
      <UpsellModal
        open={showUpsellModal}
        onClose={handleUpsellClose}
        onAccept={handleUpsellAccept}
        state={state}
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

      {/* Upsell Accepted Badge */}
      {upsellAccepted && (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Option supplémentaire ajoutée à votre contrat</span>
            </div>
          </CardContent>
        </Card>
      )}

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

