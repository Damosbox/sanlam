import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2, FileText, Image as ImageIcon, Globe } from "lucide-react";
import { toast } from "sonner";
import mermaid from "mermaid";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";

const b2cFlows = [
  {
    id: "diagnostic",
    title: "Diagnostic IA & Recommandations",
    steps: [
      "Utilisateur accède au Tab Diagnostic IA",
      "Remplissage UserAttributesForm (âge, famille, revenus, localisation)",
      "Clic: Obtenir mes recommandations",
      "Appel Edge Function: get-recommendations",
      "Lovable AI analyse le profil (gemini-2.5-flash)",
      "Affichage RecommendationCard avec produits recommandés",
      "Action: En savoir plus → Modal ProductCard",
      "Action: Souscrire → Redirect Tab Souscrire avec produit pré-sélectionné"
    ]
  },
  {
    id: "souscription",
    title: "Souscription Multi-étapes",
    steps: [
      "Étape 0: ProductComparator - Grille de produits avec filtres",
      "Sélection d'un produit",
      "Étape 1: CoverageCustomizer - Personnalisation des garanties",
      "Calcul de prime en temps réel",
      "Étape 2: Informations personnelles (nom, téléphone)",
      "Validation des données",
      "Étape 3: Confirmation & Paiement",
      "Sélection mode de paiement",
      "Authentification (si nécessaire)",
      "Insertion dans table subscriptions",
      "Génération policy_number",
      "Redirect: Tab Mes polices"
    ]
  },
  {
    id: "sinistre",
    title: "Déclaration de Sinistre (OCR + Map)",
    steps: [
      "Tab Sinistre OCR → ClaimOCR Component",
      "Upload fichier image/PDF via drag & drop",
      "Appel Edge Function: ocr-claim",
      "Lovable AI: Extraction données (type, date, montant)",
      "Affichage ClaimSummary avec données pré-remplies",
      "Validation/modification par l'utilisateur",
      "Redirect: /b2c/claims/new",
      "DamageForm: Saisie détails",
      "DamageMap: Carte interactive véhicule",
      "Clic sur zones de dommage → Modal (type + sévérité)",
      "Ajout markers sur la map",
      "Soumission: Insertion claims + damage_zones",
      "Toast succès → Redirect Dashboard"
    ]
  },
  {
    id: "polices",
    title: "Consultation des Polices",
    steps: [
      "Tab Mes polices",
      "Fetch subscriptions depuis Supabase",
      "Affichage liste des polices actives",
      "Card par police: Produit, Prime, Dates, Statut",
      "Actions: Voir détails → Modal détaillé",
      "Actions: Télécharger attestation → Génération PDF",
      "Actions: Déclarer un sinistre → Redirect OCR",
      "Actions: Modifier (si autorisé)"
    ]
  },
  {
    id: "chat",
    title: "Chat Omnicanal (In-App AI)",
    steps: [
      "Clic: Floating Chat Button",
      "OmnichannelChat Modal",
      "Chargement historique messages",
      "Input utilisateur: Question",
      "Appel Edge Function: chat-omnichannel",
      "Contexte: Polices, Sinistres, Profil utilisateur",
      "Lovable AI (gemini-2.5-flash): Génération réponse",
      "Streaming réponse progressive",
      "Réponses contextuelles avec CTA pertinents"
    ]
  },
  {
    id: "messages",
    title: "Messages avec Courtier",
    steps: [
      "Tab Messages",
      "Vérification courtier assigné",
      "Si oui: CustomerMessages Component",
      "Récupération conversation depuis DB",
      "Affichage historique messages",
      "Input: Nouveau message",
      "Appel Edge Function: chat-broker-customer",
      "IA analyse question + contexte client",
      "Génération réponse assistée avec recommandations",
      "Sauvegarde en DB + Streaming au client",
      "Affichage produits suggérés (si pertinent)"
    ]
  }
];

const b2bFlows = [
  {
    id: "sinistres",
    title: "Gestion des Sinistres",
    steps: [
      "Tab Sinistres → BrokerClaimsTable",
      "Fetch claims assignés au broker",
      "Affichage tableau avec filtres (statut)",
      "Action: Voir détails → Modal avec infos complètes",
      "Visualisation: DamageMap + Photos + Données OCR",
      "Action: Changer statut (Draft/InReview/Approved/Rejected)",
      "Update table claims",
      "Action: Contacter client → Redirect Tab Messages"
    ]
  },
  {
    id: "clients",
    title: "Gestion des Clients",
    steps: [
      "Tab Clients → BrokerClients",
      "Fetch clients assignés via subscriptions",
      "Affichage liste clients",
      "Sélection client → Vue détaillée profil",
      "Infos: Nom, Email, Téléphone, Attributs",
      "Polices actives du client",
      "Historique sinistres",
      "Action: Contacter → Ouvre Messages",
      "Action: Voir polices → Liste subscriptions",
      "Action: Recommandations IA → Produits suggérés",
      "Partage recommandations via Messages"
    ]
  },
  {
    id: "polices",
    title: "Gestion des Polices",
    steps: [
      "Tab Polices → BrokerSubscriptions",
      "Fetch subscriptions assignées",
      "Affichage tableau avec filtres (statut, produit, client)",
      "Action: Voir détails → Modal avec garanties",
      "Historique paiements + Documents",
      "Action: Modifier police (si autorisé)",
      "Action: Renouveler → Nouvelle end_date",
      "Action: Télécharger attestation → PDF",
      "Action: Contacter client → Messages avec contexte"
    ]
  },
  {
    id: "insights",
    title: "AI Insights & Analytics",
    steps: [
      "BrokerAIInsights Component",
      "Appel Edge Function: broker-insights",
      "Agrégation données: Clients, Produits, Sinistres",
      "Lovable AI: Analyse patterns",
      "Génération insights intelligents",
      "Opportunités cross-sell identifiées",
      "Alertes proactives (sinistres à risque, renouvellements)",
      "Top 3 actions suggérées",
      "Clic action → Contacter client avec contexte IA"
    ]
  },
  {
    id: "messages",
    title: "Messagerie Clients avec IA",
    steps: [
      "Tab Messages → BrokerMessages",
      "Fetch conversations avec clients assignés",
      "Liste triée par date avec badges non lus",
      "Sélection conversation → Historique messages",
      "Contexte enrichi: Polices, Sinistres, Profil client",
      "Input: Nouveau message broker",
      "Appel Edge Function: chat-broker-customer",
      "IA génère réponse assistée",
      "Recommandations: Produits complémentaires, Gaps couverture",
      "Arguments de vente personnalisés",
      "Affichage cards produits dans chat",
      "Action: Proposer un devis → Création lead",
      "Sauvegarde + Streaming au broker",
      "Client voit message en temps réel"
    ]
  }
];

// Composant pour afficher un diagramme Mermaid
const MermaidDiagram = ({ chart, id }: { chart: string; id: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = chart;
      mermaid.run({ nodes: [ref.current] });
    }
  }, [chart]);

  return <div ref={ref} id={id} className="mermaid-diagram my-4" />;
};

export const AdminUXFlows = () => {
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: 'neutral',
      flowchart: { curve: 'basis' }
    });
  }, []);

  const generateMermaidCode = (flow: typeof b2cFlows[0]) => {
    let code = "flowchart TD\n";
    
    flow.steps.forEach((step, idx) => {
      const nodeId = `S${idx + 1}`;
      const nextNodeId = `S${idx + 2}`;
      const cleanStep = step.replace(/"/g, "'");
      
      code += `    ${nodeId}["${cleanStep}"]\n`;
      
      if (idx < flow.steps.length - 1) {
        code += `    ${nodeId} --> ${nextNodeId}\n`;
      }
    });
    
    return code;
  };

  // Export .mmd files in ZIP
  const exportMermaidFiles = async (type: 'b2c' | 'b2b' | 'all') => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const flows = type === 'b2c' ? b2cFlows : type === 'b2b' ? b2bFlows : [...b2cFlows, ...b2bFlows];
      const prefix = type === 'b2c' ? 'B2C' : type === 'b2b' ? 'B2B' : '';

      flows.forEach((flow, idx) => {
        const mermaidCode = generateMermaidCode(flow);
        const fileName = `${prefix ? prefix + '-' : ''}${idx + 1}-${flow.id}.mmd`;
        zip.file(fileName, mermaidCode);
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Parcours-UX-${type.toUpperCase()}-Mermaid.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fichiers Mermaid (.mmd) téléchargés !");
    } catch (error) {
      toast.error("Erreur lors de l'export Mermaid");
    } finally {
      setIsExporting(false);
    }
  };

  // Export PDF with rendered diagrams
  const exportPDF = async (type: 'b2c' | 'b2b' | 'all') => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const diagrams = document.querySelectorAll('.mermaid-diagram svg');
      
      if (diagrams.length === 0) {
        toast.error("Veuillez attendre que les diagrammes soient chargés");
        setIsExporting(false);
        return;
      }

      let yOffset = 20;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFontSize(18);
      pdf.text('Parcours UX - Documentation', 15, yOffset);
      yOffset += 15;

      for (let i = 0; i < diagrams.length; i++) {
        const diagram = diagrams[i] as SVGElement;
        const parentCard = diagram.closest('.flow-card');
        const title = parentCard?.querySelector('.flow-title')?.textContent || `Flow ${i + 1}`;

        if (yOffset > pageHeight - 40) {
          pdf.addPage();
          yOffset = 20;
        }

        pdf.setFontSize(14);
        pdf.text(title, 15, yOffset);
        yOffset += 10;

        try {
          const canvas = await html2canvas(diagram.parentElement as HTMLElement, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 30;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (yOffset + imgHeight > pageHeight - 20) {
            pdf.addPage();
            yOffset = 20;
          }

          pdf.addImage(imgData, 'PNG', 15, yOffset, imgWidth, imgHeight);
          yOffset += imgHeight + 15;
        } catch (err) {
          console.error('Error rendering diagram:', err);
        }
      }

      pdf.save(`Parcours-UX-${type.toUpperCase()}.pdf`);
      toast.success("PDF généré avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Export HTML standalone
  const exportHTML = (type: 'b2c' | 'b2b' | 'all') => {
    setIsExporting(true);
    try {
      const flows = type === 'b2c' ? b2cFlows : type === 'b2b' ? b2bFlows : [...b2cFlows, ...b2bFlows];
      
      let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parcours UX - ${type.toUpperCase()}</title>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
  </script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; background: #f5f5f5; }
    h1 { color: #333; border-bottom: 3px solid #4f46e5; padding-bottom: 0.5rem; }
    h2 { color: #4f46e5; margin-top: 2rem; }
    .flow { background: white; padding: 1.5rem; margin: 1.5rem 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .mermaid { margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>Parcours UX - Documentation ${type.toUpperCase()}</h1>
  <p>Date de génération: ${new Date().toLocaleDateString('fr-FR')}</p>
`;

      flows.forEach((flow, idx) => {
        html += `
  <div class="flow">
    <h2>${idx + 1}. ${flow.title}</h2>
    <pre class="mermaid">${generateMermaidCode(flow)}</pre>
  </div>`;
      });

      html += `
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Parcours-UX-${type.toUpperCase()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fichier HTML interactif téléchargé !");
    } catch (error) {
      toast.error("Erreur lors de l'export HTML");
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parcours UX & Flow Documentation</CardTitle>
              <CardDescription>Documentation complète des parcours utilisateurs B2C et B2B</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <Button onClick={() => exportMermaidFiles('all')} disabled={isExporting} variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Mermaid (.mmd)
                </Button>
                <Button onClick={() => exportPDF('all')} disabled={isExporting} variant="outline" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={() => exportHTML('all')} disabled={isExporting}>
                  <Globe className="w-4 h-4 mr-2" />
                  HTML Interactif
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="b2c">
            <TabsList>
              <TabsTrigger value="b2c">Parcours B2C</TabsTrigger>
              <TabsTrigger value="b2b">Parcours B2B</TabsTrigger>
            </TabsList>

            <TabsContent value="b2c" className="space-y-6 mt-6">
              {b2cFlows.map((flow, idx) => (
                <Card key={flow.id} className="border-l-4 border-primary flow-card">
                  <CardHeader>
                    <CardTitle className="text-lg flow-title">{flow.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MermaidDiagram 
                      chart={generateMermaidCode(flow)} 
                      id={`b2c-${flow.id}-${idx}`}
                    />
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                        Voir les étapes détaillées
                      </summary>
                      <ol className="space-y-2 mt-3">
                        {flow.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                              {stepIdx + 1}
                            </span>
                            <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="b2b" className="space-y-6 mt-6">
              {b2bFlows.map((flow, idx) => (
                <Card key={flow.id} className="border-l-4 border-primary flow-card">
                  <CardHeader>
                    <CardTitle className="text-lg flow-title">{flow.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MermaidDiagram 
                      chart={generateMermaidCode(flow)} 
                      id={`b2b-${flow.id}-${idx}`}
                    />
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                        Voir les étapes détaillées
                      </summary>
                      <ol className="space-y-2 mt-3">
                        {flow.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                              {stepIdx + 1}
                            </span>
                            <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Export Mermaid (.mmd)</h4>
                    <p className="text-sm text-muted-foreground">
                      Fichiers sources Mermaid éditables sur <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-primary underline">mermaid.live</a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ImageIcon className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Export PDF</h4>
                    <p className="text-sm text-muted-foreground">
                      Document PDF avec tous les diagrammes rendus (nécessite que les diagrammes soient chargés)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Export HTML Interactif</h4>
                    <p className="text-sm text-muted-foreground">
                      Fichier HTML standalone avec diagrammes Mermaid interactifs (fonctionne sans connexion Internet après téléchargement)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
