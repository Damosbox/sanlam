import { DocumentTemplatesList } from "@/components/admin/documents/DocumentTemplatesList";

export default function DocumentTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Templates de Documents</h1>
        <p className="text-muted-foreground">
          Créez et gérez les modèles HTML pour la génération de documents (contrats, attestations, avenants).
        </p>
      </div>
      <DocumentTemplatesList />
    </div>
  );
}
