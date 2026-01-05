import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Star, MessageSquare, ListChecks, Gauge } from "lucide-react";

interface SurveyQuestion {
  id: string;
  type: "nps" | "rating" | "multiple_choice" | "text";
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyQuestionBuilderProps {
  questions: SurveyQuestion[];
  onChange: (questions: SurveyQuestion[]) => void;
}

const QUESTION_TYPES = [
  { value: "nps", label: "NPS (0-10)", icon: Gauge },
  { value: "rating", label: "Étoiles (1-5)", icon: Star },
  { value: "multiple_choice", label: "Choix multiples", icon: ListChecks },
  { value: "text", label: "Texte libre", icon: MessageSquare },
];

export const SurveyQuestionBuilder = ({ questions, onChange }: SurveyQuestionBuilderProps) => {
  const [newOption, setNewOption] = useState("");

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: crypto.randomUUID(),
      type: "rating",
      question: "",
      options: [],
      required: true,
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const addOption = (questionId: string) => {
    if (!newOption.trim()) return;
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        options: [...(question.options || []), newOption.trim()],
      });
      setNewOption("");
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question?.options) {
      updateQuestion(questionId, {
        options: question.options.filter((_, i) => i !== optionIndex),
      });
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    const questionType = QUESTION_TYPES.find((t) => t.value === type);
    if (questionType) {
      const Icon = questionType.icon;
      return <Icon className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id} className="p-4">
          <div className="flex items-start gap-2">
            <div className="cursor-move text-muted-foreground">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Q{index + 1}
                </span>
                {getQuestionTypeIcon(question.type)}
              </div>

              <Input
                value={question.question}
                onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                placeholder="Saisissez votre question..."
              />

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Select
                    value={question.type}
                    onValueChange={(value: SurveyQuestion["type"]) =>
                      updateQuestion(question.id, { type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Obligatoire</Label>
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked) =>
                      updateQuestion(question.id, { required: checked })
                    }
                  />
                </div>
              </div>

              {question.type === "multiple_choice" && (
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <Label className="text-sm text-muted-foreground">Options de réponse</Label>
                  {question.options?.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <span className="text-sm bg-muted px-2 py-1 rounded flex-1">
                        {option}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(question.id, optIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Nouvelle option..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOption(question.id);
                        }
                      }}
                    />
                    <Button variant="outline" onClick={() => addOption(question.id)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}

      <Button variant="outline" onClick={addQuestion} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter une question
      </Button>
    </div>
  );
};
