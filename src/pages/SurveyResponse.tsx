import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CheckCircle, Star, Loader2 } from "lucide-react";

interface SurveyQuestion {
  id: string;
  type: "nps" | "rating" | "multiple_choice" | "text";
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyData {
  id: string;
  template: {
    name: string;
    description: string | null;
    questions: SurveyQuestion[];
  };
}

const SurveyResponse = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!token) return;

      try {
        const { data: sendData, error: sendError } = await supabase
          .from("survey_sends")
          .select(`
            id,
            status,
            survey_templates (
              name,
              description,
              questions
            )
          `)
          .eq("unique_token", token)
          .single();

        if (sendError) throw sendError;

        if (sendData.status === "completed") {
          setIsSubmitted(true);
        } else {
          setSurvey({
            id: sendData.id,
            template: sendData.survey_templates as any,
          });

          // Mark as opened
          await supabase
            .from("survey_sends")
            .update({ status: "opened", opened_at: new Date().toISOString() })
            .eq("id", sendData.id);
        }
      } catch (error) {
        console.error("Error fetching survey:", error);
        toast.error("Enquête introuvable ou expirée");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [token]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!survey) return;

    // Validate required questions
    const requiredQuestions = survey.template.questions.filter((q) => q.required);
    const missingAnswers = requiredQuestions.filter((q) => !answers[q.id]);

    if (missingAnswers.length > 0) {
      toast.error("Veuillez répondre à toutes les questions obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      // Find NPS score if any
      const npsQuestion = survey.template.questions.find((q) => q.type === "nps");
      const npsScore = npsQuestion ? answers[npsQuestion.id] : null;

      // Insert response
      const { error: responseError } = await supabase.from("survey_responses").insert({
        survey_send_id: survey.id,
        answers,
        nps_score: npsScore ? parseInt(npsScore) : null,
        comment: comment || null,
      });

      if (responseError) throw responseError;

      // Update send status
      await supabase
        .from("survey_sends")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", survey.id);

      setIsSubmitted(true);
      toast.success("Merci pour votre réponse !");
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast.error("Erreur lors de l'envoi de votre réponse");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    switch (question.type) {
      case "nps":
        return (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Pas du tout probable</span>
              <span>Très probable</span>
            </div>
            <div className="flex gap-2 justify-between">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  onClick={() => handleAnswerChange(question.id, score)}
                  className={`w-10 h-10 rounded-lg border font-medium transition-all ${
                    answers[question.id] === score
                      ? score <= 6
                        ? "bg-[hsl(var(--red))] text-white border-[hsl(var(--red))]"
                        : score <= 8
                        ? "bg-[hsl(var(--yellow))] text-white border-[hsl(var(--yellow))]"
                        : "bg-[hsl(var(--bright-green))] text-white border-[hsl(var(--bright-green))]"
                      : "hover:bg-muted"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        );

      case "rating":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleAnswerChange(question.id, star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    answers[question.id] >= star
                      ? "fill-[hsl(var(--yellow))] text-[hsl(var(--yellow))]"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        );

      case "multiple_choice":
        return (
          <RadioGroup
            value={answers[question.id] || ""}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "text":
        return (
          <Textarea
            value={answers[question.id] || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Votre réponse..."
            rows={3}
          />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--bright-green))]/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[hsl(var(--bright-green))]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Merci !</h2>
            <p className="text-muted-foreground">
              Votre réponse a bien été enregistrée. Nous apprécions votre feedback.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold mb-2">Enquête introuvable</h2>
            <p className="text-muted-foreground">
              Cette enquête n'existe pas ou a expiré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{survey.template.name}</CardTitle>
            {survey.template.description && (
              <CardDescription>{survey.template.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-8">
            {survey.template.questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <Label className="text-base">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-[hsl(var(--red))] ml-1">*</span>}
                </Label>
                {renderQuestion(question)}
              </div>
            ))}

            <div className="space-y-3 pt-4 border-t">
              <Label>Commentaire (optionnel)</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Avez-vous d'autres remarques ou suggestions ?"
                rows={4}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer mes réponses"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SurveyResponse;
