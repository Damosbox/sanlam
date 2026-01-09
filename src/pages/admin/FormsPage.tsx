import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { AdminFormBuilder } from "@/components/admin/AdminFormBuilder";
import { FormTemplatesList } from "@/components/admin/FormTemplatesList";

export default function FormsPage() {
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Générateur de Formulaires</h1>
          <p className="text-muted-foreground">
            Créez et gérez les formulaires de souscription.
          </p>
        </div>
        {!showFormBuilder && (
          <Button onClick={() => setShowFormBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Formulaire
          </Button>
        )}
        {showFormBuilder && (
          <Button 
            variant="outline" 
            onClick={() => setShowFormBuilder(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        )}
      </div>
      
      {showFormBuilder ? (
        <AdminFormBuilder />
      ) : (
        <FormTemplatesList onEdit={() => setShowFormBuilder(true)} />
      )}
    </div>
  );
}
