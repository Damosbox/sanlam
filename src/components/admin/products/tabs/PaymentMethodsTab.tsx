import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Smartphone, Building2, MapPin } from "lucide-react";
import { ProductFormData } from "../ProductForm";

interface PaymentMethodsTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

const paymentMethods = [
  { key: "cb", label: "Carte bancaire", icon: CreditCard, description: "Visa, Mastercard" },
  { key: "wave", label: "Wave", icon: Smartphone, description: "Paiement mobile Wave" },
  { key: "orange_money", label: "Orange Money", icon: Smartphone, description: "Paiement mobile Orange" },
  { key: "mtn_momo", label: "MTN MoMo", icon: Smartphone, description: "Paiement mobile MTN" },
  { key: "bank_transfer", label: "Virement bancaire", icon: Building2, description: "Transfert depuis compte bancaire" },
  { key: "agency", label: "Paiement en agence", icon: MapPin, description: "Paiement au guichet" },
];

export function PaymentMethodsTab({ formData, updateField }: PaymentMethodsTabProps) {
  const methods = formData.payment_methods || {};

  const toggleMethod = (key: string) => {
    updateField("payment_methods", {
      ...methods,
      [key]: !methods[key],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moyens de paiement acceptés</CardTitle>
        <CardDescription>
          Activez ou désactivez les moyens de paiement disponibles pour ce produit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div
                key={method.key}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="text-base">{method.label}</Label>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </div>
                <Switch
                  checked={methods[method.key] ?? true}
                  onCheckedChange={() => toggleMethod(method.key)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
