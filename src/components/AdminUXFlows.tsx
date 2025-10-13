import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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

export const AdminUXFlows = () => {
  const [isExporting, setIsExporting] = useState(false);

  const generateMermaidDiagram = (flow: typeof b2cFlows[0]) => {
    let mermaid = "```mermaid\nflowchart TD\n";
    
    flow.steps.forEach((step, idx) => {
      const nodeId = `S${idx + 1}`;
      const nextNodeId = `S${idx + 2}`;
      const cleanStep = step.replace(/"/g, "'");
      
      mermaid += `    ${nodeId}["${cleanStep}"]\n`;
      
      if (idx < flow.steps.length - 1) {
        mermaid += `    ${nodeId} --> ${nextNodeId}\n`;
      }
    });
    
    mermaid += "```\n\n";
    return mermaid;
  };

  const exportToMarkdown = (type: 'b2c' | 'b2b' | 'all') => {
    let content = "# Parcours UX - Documentation\n\n";
    content += `Date de génération: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    content += "Visualisez ces diagrammes sur [mermaid.live](https://mermaid.live)\n\n";

    if (type === 'b2c' || type === 'all') {
      content += "## Parcours B2C (Client)\n\n";
      b2cFlows.forEach((flow, idx) => {
        content += `### ${idx + 1}. ${flow.title}\n\n`;
        content += generateMermaidDiagram(flow);
        content += "**Détails des étapes:**\n\n";
        flow.steps.forEach((step, stepIdx) => {
          content += `${stepIdx + 1}. ${step}\n`;
        });
        content += "\n---\n\n";
      });
    }

    if (type === 'b2b' || type === 'all') {
      content += "## Parcours B2B (Courtier)\n\n";
      b2bFlows.forEach((flow, idx) => {
        content += `### ${idx + 1}. ${flow.title}\n\n`;
        content += generateMermaidDiagram(flow);
        content += "**Détails des étapes:**\n\n";
        flow.steps.forEach((step, stepIdx) => {
          content += `${stepIdx + 1}. ${step}\n`;
        });
        content += "\n---\n\n";
      });
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = type === 'all' ? 'Parcours-UX-Complet.md' : `Parcours-UX-${type.toUpperCase()}.md`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Documentation téléchargée avec diagrammes Mermaid !");
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
            <div className="flex gap-2">
              <Button onClick={() => exportToMarkdown('b2c')} disabled={isExporting} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export B2C
              </Button>
              <Button onClick={() => exportToMarkdown('b2b')} disabled={isExporting} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export B2B
              </Button>
              <Button onClick={() => exportToMarkdown('all')} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                Export Complet
              </Button>
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
              {b2cFlows.map((flow) => (
                <Card key={flow.id} className="border-l-4 border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">{flow.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {flow.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="b2b" className="space-y-6 mt-6">
              {b2bFlows.map((flow) => (
                <Card key={flow.id} className="border-l-4 border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">{flow.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {flow.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Diagrammes interactifs</h4>
                  <p className="text-sm text-muted-foreground">
                    Pour visualiser ces parcours sous forme de diagrammes interactifs (Mermaid), 
                    vous pouvez utiliser des outils en ligne comme{" "}
                    <a 
                      href="https://mermaid.live" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      mermaid.live
                    </a>
                    {" "}avec les fichiers Markdown exportés.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
