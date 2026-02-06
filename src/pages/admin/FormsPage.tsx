import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FormTemplatesListTable } from "@/components/admin/FormTemplatesListTable";
import { FormEditorDrawer } from "@/components/admin/products/FormEditorDrawer";

export default function FormsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const handleNewForm = () => {
    setSelectedFormId(null);
    setDrawerOpen(true);
  };

  const handleEditForm = (formId: string) => {
    setSelectedFormId(formId);
    setDrawerOpen(true);
  };

  const handleFormSaved = () => {
    setDrawerOpen(false);
    setSelectedFormId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Générateur de Formulaires</h1>
          <p className="text-muted-foreground">
            Créez et gérez les formulaires de souscription avec cotation et souscription.
          </p>
        </div>
        <Button onClick={handleNewForm}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Formulaire
        </Button>
      </div>

      <FormTemplatesListTable onEdit={handleEditForm} />

      <FormEditorDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        formId={selectedFormId}
        onFormSaved={handleFormSaved}
      />
    </div>
  );
}
