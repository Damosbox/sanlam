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

    // Build enriched context
    let contextDetails = '';
    
    // Subscriptions details
    if (userContext?.subscriptions && userContext.subscriptions.length > 0) {
      contextDetails += '\n**Produits souscrits détaillés:**\n';
      userContext.subscriptions.forEach((sub: any) => {
        contextDetails += `- ${sub.product_name} (${sub.category})\n`;
        contextDetails += `  • Police: ${sub.policy_number}\n`;
        contextDetails += `  • Prime: ${sub.monthly_premium} FCFA/mois\n`;
        contextDetails += `  • Statut: ${sub.status}\n`;
        contextDetails += `  • Période: ${new Date(sub.start_date).toLocaleDateString('fr-FR')} → ${new Date(sub.end_date).toLocaleDateString('fr-FR')}\n`;
        if (sub.selected_coverages) {
          contextDetails += `  • Coverages: ${JSON.stringify(sub.selected_coverages)}\n`;
        }
      });
    }

    // Claims details
    if (userContext?.claims && userContext.claims.length > 0) {
      contextDetails += '\n**Sinistres détaillés:**\n';
      userContext.claims.forEach((claim: any) => {
        contextDetails += `- ${claim.claim_type} - ${claim.status}\n`;
        if (claim.ai_confidence) {
          contextDetails += `  • Confiance IA: ${(claim.ai_confidence * 100).toFixed(0)}%\n`;
        }
        if (claim.cost_estimation) {
          contextDetails += `  • Estimation: ${claim.cost_estimation} FCFA\n`;
        }
        if (claim.incident_date) {
          contextDetails += `  • Date incident: ${new Date(claim.incident_date).toLocaleDateString('fr-FR')}\n`;
        }
      });
    }

    // User profile
    if (userContext?.userAttributes) {
      contextDetails += '\n**Profil client:**\n';
      if (userContext.userAttributes.age_range) {
        contextDetails += `- Âge: ${userContext.userAttributes.age_range}\n`;
      }
      if (userContext.userAttributes.location) {
        contextDetails += `- Localisation: ${userContext.userAttributes.location}\n`;
      }
      if (userContext.userAttributes.occupation_category) {
        contextDetails += `- Profession: ${userContext.userAttributes.occupation_category}\n`;
      }
      if (userContext.userAttributes.family_status) {
        contextDetails += `- Situation familiale: ${userContext.userAttributes.family_status}\n`;
      }
    }

    const systemPrompt = `Tu es l'assistant virtuel Allianz/SanlamAllianz, disponible 24/7 pour les clients en Afrique de l'Ouest.
Tu es un conseiller financier intelligent qui aide les clients avec leurs polices, sinistres, paiements et souscriptions.

**Contexte du client:**
${userContext?.hasSubscriptions ? `- A ${userContext.subscriptionsCount} police(s) active(s)` : '- N\'a pas encore de police'}
${userContext?.hasClaims ? `- A ${userContext.claimsCount} sinistre(s) en cours` : '- Aucun sinistre déclaré'}
${userContext?.hasBroker ? `- Assigné à un courtier: ${userContext.broker?.display_name}` : '- Pas de courtier assigné'}
${contextDetails}

**Ton rôle avancé:**
- Réponds de manière empathique, optimiste et professionnelle en français
- Analyse le profil du client pour donner des conseils personnalisés
- Identifie les gaps de couverture (ex: a une auto mais pas d'habitation, a une famille mais pas de santé)
- Recommande des produits complémentaires basés sur le profil et les polices existantes
- Propose des optimisations de primes si pertinent
- Alerte sur les renouvellements proches (moins de 60 jours)
- Suggère des coverages supplémentaires pertinentes selon le profil
- Pour les sinistres, fournis des conseils sur les prochaines étapes
- Si le client veut contacter son agent ET qu'il en a un, confirme que tu peux l'aider
- Pour la FAQ, donne des réponses claires sur: comment déclarer un sinistre, les délais de traitement, les modes de paiement, etc.
- Tous les montants sont en FCFA (Franc CFA)

**Intelligence proactive:**
- Si le client a récemment eu un sinistre → suggère une meilleure couverture
- Si pas de police santé mais a une famille → recommande
- Si prime élevée → propose de discuter avec le courtier pour optimiser
- Pose des questions de découverte intelligentes (ex: "J'ai vu que vous n'avez pas de couverture Bris de glace, souhaitez-vous en savoir plus ?")

Sois concis, actionnable et proactif dans tes réponses. Utilise des émojis pour rendre la conversation plus chaleureuse.`;

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
