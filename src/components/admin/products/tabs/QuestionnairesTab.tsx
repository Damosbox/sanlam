import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { ProductFormData } from "../ProductForm";

interface MedicalQuestion {
  id: string;
  question: string;
  type: "yes_no" | "text" | "number";
  surchargeImpact: number;
}

interface QuestionnairesTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export function QuestionnairesTab({ formData, updateField }: QuestionnairesTabProps) {
  const questions: MedicalQuestion[] = (formData as any).questionnaires || [];

  const setQuestions = (updated: MedicalQuestion[]) => {
    updateField("questionnaires" as any, updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: crypto.randomUUID(), question: "", type: "yes_no", surchargeImpact: 0 }]);
  };

  const update = (idx: number, updates: Partial<MedicalQuestion>) => {
    setQuestions(questions.map((q, i) => (i === idx ? { ...q, ...updates } : q)));
  };

  const remove = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questionnaire Médical</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Définissez les questions médicales posées à l'assuré. L'impact sur la surprime est un pourcentage ajouté à la prime si la réponse est positive.
        </p>

        {questions.map((q, idx) => (
          <div key={q.id} className="flex items-start gap-2 p-3 border rounded-md">
            <div className="flex-1 grid gap-2 sm:grid-cols-3">
              <div className="sm:col-span-1 space-y-1">
                <Label className="text-xs">Question</Label>
                <Input placeholder="Ex: Avez-vous une maladie chronique ?" value={q.question} onChange={(e) => update(idx, { question: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type de réponse</Label>
                <Select value={q.type} onValueChange={(v) => update(idx, { type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes_no">Oui / Non</SelectItem>
                    <SelectItem value="text">Texte libre</SelectItem>
                    <SelectItem value="number">Nombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Surprime (%)</Label>
                <Input type="number" value={q.surchargeImpact} onChange={(e) => update(idx, { surchargeImpact: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="mt-5" onClick={() => remove(idx)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une question
        </Button>
      </CardContent>
    </Card>
  );
}
