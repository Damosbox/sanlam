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
    const { claimsData } = await req.json();
    console.log('Received claims data:', claimsData);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Tu es un analyste expert en assurance qui aide les courtiers à optimiser la gestion de leur portefeuille de sinistres.
Ton rôle est d'analyser les données des sinistres assignés à un courtier et de fournir des insights stratégiques concrets.

Concentre-toi sur :
- L'identification des tendances (types de sinistres récurrents, coûts élevés)
- Les risques potentiels (sinistres en attente trop longtemps, estimations élevées)
- Les opportunités d'amélioration (optimisation du processus, priorisation)
- Les recommandations actionnables pour améliorer l'efficacité

Sois précis, professionnel et orienté solution.`;

    const userPrompt = `Analyse le portefeuille de sinistres suivant :

**Statistiques globales :**
- Nombre total de sinistres : ${claimsData.total}
- Sinistres en attente : ${claimsData.pending}
- Sinistres traités : ${claimsData.reviewed}
- Coût total estimé : ${claimsData.totalCost}€
- Confiance IA moyenne : ${claimsData.avgConfidence}%

**Distribution par type :**
${claimsData.byType.map((t: any) => `- ${t.type}: ${t.count} sinistres (${t.totalCost}€)`).join('\n')}

**Distribution par statut :**
${claimsData.byStatus.map((s: any) => `- ${s.status}: ${s.count} sinistres`).join('\n')}

**Sinistres prioritaires (coût > 5000€) :** ${claimsData.highValueCount}

Fournis une analyse structurée avec des insights clés et des recommandations actionnables.`;

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
