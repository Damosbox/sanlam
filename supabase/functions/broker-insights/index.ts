import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portfolioData } = await req.json();
    console.log('Received portfolio data:', portfolioData);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Tu es un analyste expert en assurance spécialisé dans le marché africain et la zone FCFA.
Ton rôle est d'analyser les données du portefeuille d'un courtier en assurance pour fournir des insights stratégiques concrets et actionnables.

Tous les montants sont en FCFA (Franc CFA).

Concentre-toi sur :
- L'analyse du portefeuille clients et de leur rentabilité
- Les tendances de sinistralité par type et par client
- Les risques financiers et opérationnels
- Les opportunités de croissance et d'optimisation
- Les recommandations actionnables pour améliorer la performance du portefeuille

Contexte du marché FCFA :
- Un sinistre > 500,000 FCFA est considéré comme important
- Revenu mensuel moyen des primes : indicateur clé de rentabilité
- Taux de sinistralité optimal : < 70%

Sois précis, professionnel et orienté solution avec des chiffres en FCFA.`;

    const userPrompt = `Analyse complète du portefeuille courtier :

**CLIENTS & PORTEFEUILLE :**
- Nombre total de clients : ${portfolioData.totalClients}
- Polices actives : ${portfolioData.activeSubscriptions}
- Revenu mensuel total : ${portfolioData.totalMonthlyRevenue.toLocaleString()} FCFA

**SINISTRALITÉ :**
- Nombre total de sinistres : ${portfolioData.totalClaims}
- En attente de traitement : ${portfolioData.pending}
- Examinés (en cours) : ${portfolioData.reviewed}
- Approuvés : ${portfolioData.approved}
- Rejetés : ${portfolioData.rejected}

**FINANCIER (FCFA) :**
- Coût total des sinistres : ${portfolioData.totalClaimsCost.toLocaleString()} FCFA
- Coût moyen par sinistre : ${Math.round(portfolioData.avgClaimCost).toLocaleString()} FCFA
- Sinistres à fort impact (> 500k FCFA) : ${portfolioData.highValueClaimsCount}

**INTELLIGENCE ARTIFICIELLE :**
- Confiance IA moyenne : ${(portfolioData.avgAiConfidence * 100).toFixed(1)}%
- Sinistres analysés par IA : ${portfolioData.claimsWithAI}/${portfolioData.totalClaims}

**DISTRIBUTION PAR TYPE :**
${portfolioData.byType.map((t: any) => `- ${t.type}: ${t.count} sinistres (${t.totalCost.toLocaleString()} FCFA)`).join('\n')}

**DISTRIBUTION PAR STATUT :**
${portfolioData.byStatus.map((s: any) => `- ${s.status}: ${s.count} sinistres`).join('\n')}

**TOP CLIENTS PAR SINISTRES :**
${portfolioData.topClients.map((c: any) => `- ${c.name}: ${c.claimsCount} sinistres (${c.totalCost.toLocaleString()} FCFA)`).join('\n')}

Fournis une analyse stratégique détaillée avec insights clés et recommandations concrètes pour optimiser ce portefeuille.`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "provide_broker_insights",
            description: "Fournir une analyse structurée du portefeuille de sinistres avec insights et recommandations",
            parameters: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  description: "Liste des insights clés identifiés (3-5 maximum)",
                  items: {
                    type: "object",
                    properties: {
                      type: { 
                        type: "string", 
                        enum: ["risk", "opportunity", "trend", "alert"],
                        description: "Type d'insight" 
                      },
                      title: { type: "string", description: "Titre court de l'insight" },
                      description: { type: "string", description: "Description détaillée" },
                      priority: { 
                        type: "string", 
                        enum: ["low", "medium", "high"],
                        description: "Niveau de priorité" 
                      }
                    },
                    required: ["type", "title", "description", "priority"],
                    additionalProperties: false
                  }
                },
                recommendations: {
                  type: "array",
                  description: "Liste des recommandations actionnables (3-5 maximum)",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string", description: "Action recommandée" },
                      impact: { type: "string", description: "Impact attendu de cette action" },
                      priority: { 
                        type: "string", 
                        enum: ["low", "medium", "high"],
                        description: "Niveau de priorité" 
                      }
                    },
                    required: ["action", "impact", "priority"],
                    additionalProperties: false
                  }
                },
                summary: {
                  type: "string",
                  description: "Résumé général de l'état du portefeuille (2-3 phrases)"
                }
              },
              required: ["insights", "recommendations", "summary"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "provide_broker_insights" } }
    };

    console.log('Calling Lovable AI Gateway...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes dépassée. Veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants. Veuillez recharger votre compte Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('AI Gateway response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Parsed analysis:', analysis);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in broker-insights function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
