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
    const { profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Tu es un conseiller en assurance expert pour Allianz/SanlamAllianz en Afrique de l'Ouest.
Analyse le profil client et recommande 2-3 produits d'assurance pertinents avec justification.
Utilise un ton empathique, optimiste et inclusif. Réponds en français.`;

    const userPrompt = `Profil client:
- Âge: ${profile.age || 'non spécifié'}
- Situation familiale: ${profile.familyStatus || 'non spécifié'}
- Profession: ${profile.profession || 'non spécifié'}
- Revenus mensuels: ${profile.income || 'non spécifié'} FCFA
- Patrimoine: ${profile.assets || 'non spécifié'}
- Besoins exprimés: ${profile.needs || 'protection générale'}

Fournis 2-3 recommandations avec titre, description, prime estimée et justification.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'recommend_products',
            description: 'Recommander des produits d\'assurance',
            parameters: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      monthlyPremium: { type: 'string' },
                      reason: { type: 'string' },
                      priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                    },
                    required: ['title', 'description', 'monthlyPremium', 'reason', 'priority']
                  }
                }
              },
              required: ['recommendations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'recommend_products' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No recommendations generated');
    }

    const recommendations = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-diagnostic:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
