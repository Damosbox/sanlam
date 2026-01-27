import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ProductFormData } from "../ProductForm";

interface FaqsTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export function FaqsTab({ formData, updateField }: FaqsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs = ((formData.faqs || []) as FAQ[]).sort((a, b) => a.order - b.order);

  const handleSaveFaq = () => {
    if (!newFaq.question || !newFaq.answer) return;

    const faq: FAQ = {
      id: editingFaq?.id || crypto.randomUUID(),
      question: newFaq.question,
      answer: newFaq.answer,
      order: editingFaq?.order ?? faqs.length,
    };

    let updatedFaqs: FAQ[];
    if (editingFaq) {
      updatedFaqs = faqs.map((f) => (f.id === editingFaq.id ? faq : f));
    } else {
      updatedFaqs = [...faqs, faq];
    }

    updateField("faqs", updatedFaqs);
    setIsDialogOpen(false);
    setEditingFaq(null);
    setNewFaq({ question: "", answer: "" });
  };

  const handleDeleteFaq = (id: string) => {
    updateField(
      "faqs",
      faqs.filter((f) => f.id !== id)
    );
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingFaq(faq);
    setNewFaq({ question: faq.question, answer: faq.answer });
    setIsDialogOpen(true);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(faqs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedFaqs = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    updateField("faqs", reorderedFaqs);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions fréquentes</CardTitle>
              <CardDescription>
                Gérez les FAQs associées à ce produit. Réorganisez-les par glisser-déposer.
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune FAQ configurée. Ajoutez votre première question.
            </p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="faqs">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {faqs.map((faq, index) => (
                      <Draggable key={faq.id} draggableId={faq.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border rounded-lg"
                          >
                            <Collapsible
                              open={expandedId === faq.id}
                              onOpenChange={() =>
                                setExpandedId(expandedId === faq.id ? null : faq.id)
                              }
                            >
                              <div className="flex items-center p-4">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mr-3 cursor-grab"
                                >
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <CollapsibleTrigger asChild>
                                  <div className="flex-1 cursor-pointer">
                                    <p className="font-medium">{faq.question}</p>
                                  </div>
                                </CollapsibleTrigger>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(faq)}
                                  >
                                    Modifier
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteFaq(faq.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      {expandedId === faq.id ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                </div>
                              </div>
                              <CollapsibleContent>
                                <div className="px-4 pb-4 pt-0 pl-12">
                                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? "Modifier la FAQ" : "Ajouter une FAQ"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                placeholder="Ex: Quelles sont les garanties incluses ?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Réponse</Label>
              <Textarea
                id="answer"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="Rédigez la réponse..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveFaq}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
