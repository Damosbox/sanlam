import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "Quelle est la meilleure pratique pour prévenir les accidents de la route ?",
    options: [
      "Vérifier son téléphone en conduisant",
      "Respecter les limites de vitesse et garder une distance de sécurité",
      "Conduire plus vite pour arriver plus tôt",
      "Ne pas utiliser la ceinture de sécurité"
    ],
    correctAnswer: 1,
    explanation: "Respecter les limites de vitesse et maintenir une distance de sécurité réduit considérablement les risques d'accidents."
  },
  {
    id: "q2",
    question: "Comment protéger votre habitation contre le vol ?",
    options: [
      "Laisser les portes ouvertes pour aérer",
      "Afficher vos objets de valeur près des fenêtres",
      "Installer un système d'alarme et des serrures renforcées",
      "Ne jamais fermer à clé"
    ],
    correctAnswer: 2,
    explanation: "Un système d'alarme et des serrures renforcées sont des mesures essentielles pour dissuader les cambrioleurs."
  },
  {
    id: "q3",
    question: "Que faire en cas d'incendie dans votre maison ?",
    options: [
      "Ouvrir toutes les fenêtres immédiatement",
      "Sortir rapidement, appeler les pompiers et ne pas retourner à l'intérieur",
      "Essayer d'éteindre le feu avec de l'eau",
      "Rester à l'intérieur et attendre de l'aide"
    ],
    correctAnswer: 1,
    explanation: "La priorité est d'évacuer immédiatement et d'appeler les secours. Ne jamais retourner dans un bâtiment en feu."
  },
  {
    id: "q4",
    question: "Quelle est la fréquence recommandée pour l'entretien de votre véhicule ?",
    options: [
      "Tous les 5 ans",
      "Uniquement quand il y a un problème",
      "Tous les 10 000 à 15 000 km ou une fois par an",
      "Jamais nécessaire"
    ],
    correctAnswer: 2,
    explanation: "Un entretien régulier tous les 10 000 à 15 000 km permet de prévenir les pannes et garantit la sécurité du véhicule."
  },
  {
    id: "q5",
    question: "Comment prévenir les dégâts des eaux dans votre habitation ?",
    options: [
      "Vérifier régulièrement les canalisations et la toiture",
      "Ne jamais fermer les robinets complètement",
      "Ignorer les petites fuites",
      "Stocker de l'eau partout dans la maison"
    ],
    correctAnswer: 0,
    explanation: "Des inspections régulières des canalisations et de la toiture permettent de détecter les problèmes avant qu'ils ne causent des dégâts importants."
  }
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const QuizPreventionModal = ({ open, onOpenChange, onComplete }: Props) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateAndSubmitScore();
    }
  };

  const calculateAndSubmitScore = async () => {
    setSubmitting(true);
    
    const correctCount = answers.filter((answer, idx) => 
      answer === QUIZ_QUESTIONS[idx].correctAnswer
    ).length;
    
    const score = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Call loyalty action processor
      await supabase.functions.invoke('loyalty-process-action', {
        body: {
          actionType: 'quiz',
          userId: user.id,
          metadata: {
            score,
            correctAnswers: correctCount,
            totalQuestions: QUIZ_QUESTIONS.length,
          }
        }
      });

      if (score >= 80) {
        toast({
          title: "🎉 Félicitations !",
          description: `Score parfait : ${score}% ! Vous avez gagné des points de fidélité.`,
        });
      } else {
        toast({
          title: "Quiz terminé",
          description: `Score : ${score}%. Continuez à apprendre !`,
        });
      }

      setShowResult(true);
      onComplete?.();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre score",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setShowExplanation(false);
    onOpenChange(false);
  };

  const correctCount = answers.filter((answer, idx) => 
    answer === QUIZ_QUESTIONS[idx].correctAnswer
  ).length;
  const finalScore = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Quiz Prévention
          </DialogTitle>
          <DialogDescription>
            Testez vos connaissances et gagnez des points de fidélité
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Question {currentQuestion + 1} sur {QUIZ_QUESTIONS.length}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{question.question}</h3>

                {!showExplanation ? (
                  <RadioGroup value={selectedAnswer?.toString()} onValueChange={(val) => setSelectedAnswer(parseInt(val))}>
                    <div className="space-y-3">
                      {question.options.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="space-y-4">
                    {question.options.map((option, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 p-3 border rounded-lg ${
                          idx === question.correctAnswer 
                            ? 'bg-green-50 border-green-500' 
                            : idx === selectedAnswer 
                            ? 'bg-red-50 border-red-500' 
                            : 'bg-muted/30'
                        }`}
                      >
                        {idx === question.correctAnswer ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : idx === selectedAnswer ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <div className="w-5 h-5" />
                        )}
                        <span className={idx === question.correctAnswer ? 'font-medium' : ''}>
                          {option}
                        </span>
                      </div>
                    ))}

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-1">💡 Explication</p>
                      <p className="text-sm text-blue-800">{question.explanation}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetQuiz}>
                Annuler
              </Button>
              
              {!showExplanation ? (
                <Button onClick={handleAnswer} disabled={selectedAnswer === null}>
                  Valider
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : currentQuestion < QUIZ_QUESTIONS.length - 1 ? (
                    "Question suivante"
                  ) : (
                    "Voir résultats"
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="p-6 text-center">
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${finalScore >= 80 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                <h3 className="text-2xl font-bold mb-2">Score final</h3>
                <p className="text-4xl font-bold text-primary mb-4">{finalScore}%</p>
                <p className="text-muted-foreground mb-4">
                  {correctCount} bonnes réponses sur {QUIZ_QUESTIONS.length} questions
                </p>
                
                {finalScore >= 80 ? (
                  <Badge className="text-lg px-4 py-2">
                    🎉 Points de fidélité gagnés !
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Continuez à apprendre !
                  </Badge>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetQuiz}>
                Fermer
              </Button>
              <Button onClick={() => {
                setCurrentQuestion(0);
                setSelectedAnswer(null);
                setAnswers([]);
                setShowResult(false);
                setShowExplanation(false);
              }}>
                Recommencer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};