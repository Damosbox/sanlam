import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Mail, Clock, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { sanitizeForClient } from "@/utils/clientSafeFilter";

interface ClientValueNoteProps {
  analysis: any;
  competitorName: string;
  clientContext?: string;
}

export const ClientValueNote = ({ analysis, competitorName, clientContext }: ClientValueNoteProps) => {
  const [clientSafeMode, setClientSafeMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const filteredAnalysis = clientSafeMode ? sanitizeForClient(analysis) : analysis;

  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('value-note-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`note-valeur-client-${competitorName || 'concurrent'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyEmail = () => {
    const emailTemplate = generateEmailTemplate(filteredAnalysis, competitorName, clientContext);
    navigator.clipboard.writeText(emailTemplate);
  };

  const top3Differentiators = getTop3Differentiators(filteredAnalysis);
  const axes = getAxesScores(filteredAnalysis);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center justify-end">
        <Switch 
          id="client-safe"
          checked={clientSafeMode} 
          onCheckedChange={setClientSafeMode}
        />
        <Label htmlFor="client-safe" className="cursor-pointer">Mode client-safe</Label>
        <Button onClick={downloadPDF} disabled={isGenerating}>
          <Download className="mr-2 h-4 w-4" />
          {isGenerating ? "Génération..." : "Télécharger PDF"}
        </Button>
        <Button variant="outline" onClick={copyEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Copier l'e-mail
        </Button>
      </div>

      <div id="value-note-content" className="max-w-4xl mx-auto p-8 bg-background border rounded-lg space-y-6">
        {/* HEADER */}
        <div className="border-b pb-4">
          <img src="/logo_sanlam.svg" alt="Sanlam Allianz" className="h-12 mb-4" />
          <h1 className="text-3xl font-bold">Note de Valeur Client</h1>
          {!clientSafeMode && competitorName && (
            <p className="text-lg text-muted-foreground mt-1">
              Comparaison avec {competitorName}
            </p>
          )}
          {clientContext && (
            <p className="text-sm text-muted-foreground mt-2">
              {clientContext}
            </p>
          )}
        </div>

        {/* TEACHING INSIGHT */}
        {filteredAnalysis.teaching_insight && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">Pourquoi changer ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium text-lg">{filteredAnalysis.teaching_insight.recadrage_probleme}</p>
              <p className="text-sm">{filteredAnalysis.teaching_insight.tailoring_segment}</p>
            </CardContent>
          </Card>
        )}

        {/* TABLEAU COMPARATIF 4 AXES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {axes.map((axe, idx) => (
            <Card key={idx} className={axe.avantage_nous ? 'border-green-600 border-2' : ''}>
              <CardContent className="pt-4 text-center space-y-2">
                <Badge className={axe.avantage_nous ? 'bg-green-600' : 'bg-muted'}>
                  {axe.score}/10
                </Badge>
                <h3 className="font-semibold text-sm">{axe.nom}</h3>
                {axe.avantage_nous && (
                  <p className="text-xs text-green-700">{axe.differenciateur}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* NOS 3 DIFFÉRENCIATEURS CLÉS */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Nos 3 différenciateurs clés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {top3Differentiators.map((diff, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>{diff}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* QUANTIFICATION VALEUR */}
        {filteredAnalysis.quantification_valeur && (
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle>Valeur chiffrée</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {filteredAnalysis.quantification_valeur.gain_temps_sinistre && (
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {filteredAnalysis.quantification_valeur.gain_temps_sinistre}
                  </li>
                )}
                {filteredAnalysis.quantification_valeur.valeur_services && (
                  <li className="flex items-center gap-2">
                    💰 {filteredAnalysis.quantification_valeur.valeur_services}
                  </li>
                )}
              </ul>
              {filteredAnalysis.quantification_valeur.sources && (
                <p className="text-xs text-muted-foreground mt-3">
                  Sources : {filteredAnalysis.quantification_valeur.sources.join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* EXPÉRIENCE SINISTRE */}
        {filteredAnalysis.experience_sinistre && (
          <Card className="border-green-600 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Notre engagement sinistre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAnalysis.experience_sinistre.delai && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Délai moyen</span>
                    <Badge variant="default" className="bg-green-600">
                      {filteredAnalysis.experience_sinistre.delai}
                    </Badge>
                  </div>
                )}
                {filteredAnalysis.experience_sinistre.canaux && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Canaux disponibles</span>
                    <Badge variant="outline">{filteredAnalysis.experience_sinistre.canaux}</Badge>
                  </div>
                )}
                {filteredAnalysis.experience_sinistre.transparence && (
                  <p className="text-sm text-muted-foreground">
                    {filteredAnalysis.experience_sinistre.transparence}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* TOP 3 OBJECTIONS */}
        {filteredAnalysis.top_3_objections && filteredAnalysis.top_3_objections.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Réponses aux objections probables</h3>
            {filteredAnalysis.top_3_objections.map((obj: any, idx: number) => (
              <div key={idx} className="border-l-4 border-primary pl-4 py-2 space-y-1">
                <p className="font-medium">{obj.objection}</p>
                <p className="text-sm text-muted-foreground">{obj.reponse}</p>
                {obj.preuve && (
                  <p className="text-xs text-green-600">✓ {obj.preuve}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PREUVE SOCIALE */}
        {filteredAnalysis.cialdini_elements?.preuve_sociale && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cas client similaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{filteredAnalysis.cialdini_elements.preuve_sociale.cas_client}</p>
              {filteredAnalysis.cialdini_elements.preuve_sociale.chiffres && (
                <Badge variant="outline">{filteredAnalysis.cialdini_elements.preuve_sociale.chiffres}</Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* OFFRE RECOMMANDÉE + CTA */}
        {filteredAnalysis.offre_recommandee && (
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle>Offre recommandée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium text-lg">{filteredAnalysis.offre_recommandee.pack}</p>
              <p className="text-sm">{filteredAnalysis.offre_recommandee.option_principale}</p>
              {filteredAnalysis.offre_recommandee.bonus_reciprocite && (
                <Badge className="bg-background text-primary">
                  🎁 BONUS : {filteredAnalysis.offre_recommandee.bonus_reciprocite}
                </Badge>
              )}
              <Button className="w-full bg-background text-primary hover:bg-background/90 mt-2">
                {filteredAnalysis.offre_recommandee.appel_action || "Prendre rendez-vous"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* FOOTER CONFORMITÉ CIMA */}
        <div className="border-t pt-4 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold">Conformité CIMA</p>
          {filteredAnalysis.conformite_cima?.mentions && (
            <ul className="list-disc ml-4 space-y-1">
              {filteredAnalysis.conformite_cima.mentions.map((m: string, idx: number) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          )}
          {filteredAnalysis.conformite_cima?.transparence && (
            <p className="italic">{filteredAnalysis.conformite_cima.transparence}</p>
          )}
          <p className="mt-2">
            Date d'analyse : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getTop3Differentiators(analysis: any): string[] {
  const differentiators: string[] = [];
  
  if (analysis.weaknesses) {
    analysis.weaknesses.slice(0, 3).forEach((w: any) => {
      if (w.opportunite) differentiators.push(w.opportunite);
    });
  }
  
  if (differentiators.length < 3 && analysis.commercial_arguments) {
    analysis.commercial_arguments.slice(0, 3 - differentiators.length).forEach((arg: any) => {
      differentiators.push(arg.argument);
    });
  }
  
  return differentiators.slice(0, 3);
}

function getAxesScores(analysis: any) {
  const axesMapping = [
    { key: 'garanties', nom: 'Couverture & Exclusions' },
    { key: 'service', nom: 'Expérience Sinistre' },
    { key: 'valeur_ajoutee', nom: 'Valeur & TCoR' },
    { key: 'digitalisation', nom: 'Conformité & Transparence' }
  ];

  return axesMapping.map(axe => {
    const scoreData = analysis.positioning_scores?.[axe.key];
    const score = scoreData ? Math.round(scoreData.score / 10) : 5;
    const avantage_nous = score < 7; // Si le concurrent score moins de 70, nous avons l'avantage
    
    return {
      nom: axe.nom,
      score,
      avantage_nous,
      differenciateur: avantage_nous ? scoreData?.explanation?.substring(0, 80) : ''
    };
  });
}

function generateEmailTemplate(analysis: any, competitorName: string, clientContext?: string): string {
  const top3 = getTop3Differentiators(analysis);
  
  return `Bonjour [Nom],

Suite à notre échange, voici une analyse comparative ${competitorName ? `avec ${competitorName}` : 'de votre couverture actuelle'} et notre solution Sanlam Allianz.

${analysis.teaching_insight ? `
${analysis.teaching_insight.recadrage_probleme}

${analysis.teaching_insight.tailoring_segment}
` : ''}

Nos 3 différenciateurs clés :
${top3.map(d => `✓ ${d}`).join('\n')}

${analysis.quantification_valeur ? `
Valeur chiffrée :
${analysis.quantification_valeur.gain_temps_sinistre || ''}
${analysis.quantification_valeur.valeur_services || ''}
` : ''}

Je vous propose de nous rencontrer pour ${analysis.offre_recommandee?.bonus_reciprocite || 'un diagnostic gratuit de vos risques'}.

Cordialement,
[Signature]

---
Note : Cette analyse est fournie à titre informatif. Sanlam Allianz respecte les exigences CIMA de transparence et d'adéquation.
Date : ${new Date().toLocaleDateString('fr-FR')}
`;
}