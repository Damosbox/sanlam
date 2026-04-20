import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, ShieldAlert, Sparkles, FlaskConical } from "lucide-react";
import { PaymentStatusDialog } from "@/components/guided-sales/steps/PaymentStatusDialog";
import { AMLBlockedDialog } from "@/components/compliance/AMLBlockedDialog";

type DemoScenario =
  | null
  | "payment-success"
  | "aml-high"
  | "aml-medium"
  | "aml-low";

export default function PaymentAmlDemoPage() {
  const [scenario, setScenario] = useState<DemoScenario>(null);

  const close = () => setScenario(null);

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
          <FlaskConical className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Démo UX — Paiement & AML</h1>
          <p className="text-sm text-muted-foreground">
            Page de prévisualisation mockée pour valider les parcours.
            <Badge variant="secondary" className="ml-2">Mock only</Badge>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Parcours de validation de paiement
          </CardTitle>
          <CardDescription>
            Simule le dialog de finalisation après paiement client (progression mock).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => setScenario("payment-success")}>
            <Sparkles className="h-4 w-4 mr-2" />
            Lancer le succès complet
          </Button>
          <p className="text-xs text-muted-foreground w-full mt-2">
            Déroule : paiement → génération police → envoi multicanal → conseils & cross-sell.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
            Blocage AML / LCB-FT
          </CardTitle>
          <CardDescription>
            Modale non-fermable affichée quand le screening PEP/Sanction détecte un profil à risque.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="destructive" onClick={() => setScenario("aml-high")}>
            Risque élevé
          </Button>
          <Button variant="outline" onClick={() => setScenario("aml-medium")}>
            Risque modéré
          </Button>
          <Button variant="outline" onClick={() => setScenario("aml-low")}>
            Risque faible
          </Button>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Accessible via <code className="bg-muted px-1.5 py-0.5 rounded">/admin/dev/payment-aml</code>.
        Aucun appel backend, aucune donnée persistée.
      </p>

      {/* Payment Dialog Mock */}
      <PaymentStatusDialog
        open={scenario === "payment-success"}
        onOpenChange={(o) => !o && close()}
        onPaymentReceived={close}
        channels={["email", "sms", "whatsapp"]}
        clientEmail="demo.client@example.com"
        productType="auto"
        clientPhone="+225 07 00 00 00 00"
      />

      {/* AML Dialog Mock */}
      <AMLBlockedDialog
        open={scenario === "aml-high"}
        onOpenChange={(o) => !o && close()}
        riskLevel="high"
        contextLabel="Identification client — Parcours Auto"
        onBackToDashboard={close}
      />
      <AMLBlockedDialog
        open={scenario === "aml-medium"}
        onOpenChange={(o) => !o && close()}
        riskLevel="medium"
        contextLabel="Signature électronique — Pack Obsèques"
        onBackToDashboard={close}
      />
      <AMLBlockedDialog
        open={scenario === "aml-low"}
        onOpenChange={(o) => !o && close()}
        riskLevel="low"
        contextLabel="KYC Prospect — Fiche lead"
        onBackToDashboard={close}
      />
    </div>
  );
}