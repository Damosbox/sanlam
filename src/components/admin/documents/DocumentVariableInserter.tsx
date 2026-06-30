import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Variable } from "lucide-react";

const VARIABLE_GROUPS = [
  {
    label: "Client",
    variables: [
      { key: "nom_client", label: "Nom" },
      { key: "prenom_client", label: "Prénom" },
      { key: "email", label: "Email" },
      { key: "telephone", label: "Téléphone" },
      { key: "adresse", label: "Adresse" },
    ],
  },
  {
    label: "Police",
    variables: [
      { key: "numero_police", label: "N° Police" },
      { key: "date_effet", label: "Date d'effet" },
      { key: "date_echeance", label: "Date d'échéance" },
      { key: "prime_ttc", label: "Prime TTC" },
    ],
  },
  {
    label: "Produit",
    variables: [
      { key: "nom_produit", label: "Nom produit" },
      { key: "formule", label: "Formule" },
      { key: "garanties", label: "Garanties" },
    ],
  },
  {
    label: "Système",
    variables: [
      { key: "date_generation", label: "Date de génération" },
      { key: "numero_document", label: "N° Document" },
    ],
  },
];

interface DocumentVariableInserterProps {
  onInsert: (variable: string) => void;
}

export function DocumentVariableInserter({ onInsert }: DocumentVariableInserterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Variable className="h-4 w-4 mr-1" />
          Variables
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-2">
          {VARIABLE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground px-2 py-1">{group.label}</p>
              {group.variables.map((v) => (
                <button
                  key={v.key}
                  className="w-full text-left text-sm px-2 py-1 rounded hover:bg-accent transition-colors"
                  onClick={() => onInsert(`{{${v.key}}}`)}
                >
                  <code className="text-xs">{`{{${v.key}}}`}</code>
                  <span className="ml-2 text-muted-foreground text-xs">{v.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { VARIABLE_GROUPS };
