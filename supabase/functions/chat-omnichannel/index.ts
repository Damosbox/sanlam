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
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Tu es l'assistant virtuel Allianz/SanlamAllianz, disponible 24/7 pour les clients en Afrique de l'Ouest.
Tu aides les clients avec leurs questions sur les polices, sinistres, paiements et souscriptions.

**Contexte du client:**
${userContext?.hasSubscriptions ? `- A ${userContext.subscriptionsCount} police(s) active(s)` : '- N\'a pas encore de police'}
${userContext?.hasClaims ? `- A ${userContext.claimsCount} sinistre(s) en cours` : '- Aucun sinistre déclaré'}
${userContext?.hasBroker ? `- Assigné à un courtier: ${userContext.broker?.display_name}` : '- Pas de courtier assigné'}

**Ton rôle:**
- Réponds de manière empathique, optimiste et professionnelle en français
- Si le client demande ses polices/sinistres, mentionne qu'il peut les consulter dans son espace
- Si le client veut souscrire, propose de découvrir nos produits adaptés à ses besoins
- Si le client veut contacter son agent ET qu'il en a un, confirme que tu peux l'aider
- Pour la FAQ, donne des réponses claires sur: comment déclarer un sinistre, les délais de traitement, les modes de paiement, etc.
- Tous les montants sont en FCFA (Franc CFA)

Sois concis et actionnable dans tes réponses.`;

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
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat AI error:', response.status, errorText);
      throw new Error(`Chat failed: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in chat-omnichannel:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
