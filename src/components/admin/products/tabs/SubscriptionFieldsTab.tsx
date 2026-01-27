import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";
import { ProductFormData } from "../ProductForm";

interface SubscriptionFieldsTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

export function SubscriptionFieldsTab({ formData, updateField }: SubscriptionFieldsTabProps) {
  const { data: formTemplates } = useQuery({
    queryKey: ["form-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formulaire de souscription</CardTitle>
          <CardDescription>
            Liez un formulaire existant ou créez-en un nouveau pour définir le parcours de cotation et souscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Formulaire lié</Label>
            <Select
              value={formData.subscription_form_id || "none"}
              onValueChange={(value) => 
                updateField("subscription_form_id", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un formulaire..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun formulaire</SelectItem>
                {formTemplates?.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/admin/forms" target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                Gérer les formulaires
                <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
          <CardDescription>
            Ces champs permettent de recueillir les informations nécessaires au calcul du risque et de la cotation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Utilisez le module Formulaires pour créer un parcours de cotation dynamique avec glisser-déposer.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>
            Ces champs permettent de recueillir les informations client nécessaires pour valider la souscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les informations client (identité, coordonnées) sont collectées lors du parcours de souscription.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
