import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Getting recommendations for user:', user.id);

    // Fetch user's subscriptions
    const { data: userSubs, error: subsError } = await supabase
      .from('subscriptions')
      .select('product_id, products(id, name, category)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      throw subsError;
    }

    const userProductIds = (userSubs || []).map(s => s.product_id);
    console.log('User has products:', userProductIds);

    // Fetch user attributes for personalization
    const { data: userAttributes } = await supabase
      .from('user_attributes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('User attributes:', userAttributes);

    // Get all active products
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Filter out products user already has
    const availableProducts = (allProducts || []).filter(
      p => !userProductIds.includes(p.id)
    );

    if (availableProducts.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get collaborative filtering data: what other users with similar products bought
    const { data: otherSubs } = await supabase
      .from('subscriptions')
      .select('user_id, product_id')
      .in('product_id', userProductIds)
      .neq('user_id', user.id)
      .eq('status', 'active');

    // Count co-occurrence scores
    const coOccurrence: Record<string, number> = {};
    const usersWithSimilarProducts = new Set((otherSubs || []).map(s => s.user_id));

    if (usersWithSimilarProducts.size > 0) {
      const { data: theirOtherProducts } = await supabase
        .from('subscriptions')
        .select('product_id')
        .in('user_id', Array.from(usersWithSimilarProducts))
        .eq('status', 'active');

      (theirOtherProducts || []).forEach(sub => {
        if (!userProductIds.includes(sub.product_id)) {
          coOccurrence[sub.product_id] = (coOccurrence[sub.product_id] || 0) + 1;
        }
      });
    }

    console.log('Co-occurrence scores:', coOccurrence);

    // Calculate similarity scores for available products
    const scoredProducts = availableProducts.map(product => {
      let score = 0;
      
      // Collaborative filtering score (40%)
      score += (coOccurrence[product.id] || 0) * 0.4;

      // Attribute-based scoring (60%)
      if (userAttributes) {
        // Age-based recommendations
        if (userAttributes.age_range === '18-30' && product.category === 'Vie') score += 15;
        if (userAttributes.age_range === '31-50' && ['Santé', 'Épargne'].includes(product.category)) score += 15;
        if (userAttributes.age_range === '51+' && ['Santé', 'Retraite'].includes(product.category)) score += 20;

        // Family-based recommendations
        if (userAttributes.family_status?.includes('marié') && ['Famille', 'Santé'].includes(product.category)) score += 15;
        if (userAttributes.family_status?.includes('enfants') && ['Éducation', 'Famille'].includes(product.category)) score += 20;
        
        // Income-based recommendations
        const income = parseInt(userAttributes.income_range?.split('-')[0] || '0');
        if (income > 500000 && ['Épargne', 'Investissement'].includes(product.category)) score += 10;
        if (income < 300000 && product.category === 'Essentiel') score += 10;

        // Occupation-based recommendations
        if (userAttributes.occupation_category === 'Entrepreneur' && ['Entreprise', 'Responsabilité'].includes(product.category)) score += 15;
        if (userAttributes.occupation_category === 'Salarié' && ['Santé', 'Vie'].includes(product.category)) score += 10;
      }

      return { ...product, score };
    });

    // Sort by score and take top 3
    const topProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log('Top scored products:', topProducts.map(p => ({ name: p.name, score: p.score })));

    // Use AI to generate personalized reasons
    const aiPrompt = `Tu es un conseiller en assurance. Génère des raisons personnalisées pour recommander ces produits.

Profil utilisateur:
- Âge: ${userAttributes?.age_range || 'non spécifié'}
- Situation familiale: ${userAttributes?.family_status || 'non spécifié'}
- Profession: ${userAttributes?.occupation_category || 'non spécifié'}
- Revenus: ${userAttributes?.income_range || 'non spécifié'}
- Localisation: ${userAttributes?.location || 'non spécifié'}

Produits actuels: ${userSubs?.map(s => (s.products as any)?.name).join(', ') || 'Aucun'}

Produits à recommander:
${topProducts.map((p, i) => `${i + 1}. ${p.name} (${p.category}) - Score: ${p.score.toFixed(1)}`).join('\n')}

Pour chaque produit, génère une raison courte (max 2 phrases) expliquant pourquoi c'est pertinent pour ce profil.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Tu es un expert en assurance empathique et professionnel. Réponds en français avec des raisons courtes et convaincantes.' },
          { role: 'user', content: aiPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_reasons',
            description: 'Générer des raisons personnalisées pour chaque produit',
            parameters: {
              type: 'object',
              properties: {
                reasons: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_id: { type: 'string' },
                      reason: { type: 'string' }
                    },
                    required: ['product_id', 'reason']
                  }
                }
              },
              required: ['reasons']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_reasons' } }
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI error:', await aiResponse.text());
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let reasons: Record<string, string> = {};
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      parsed.reasons.forEach((r: any) => {
        reasons[r.product_id] = r.reason;
      });
    }

    // Build final recommendations
    const recommendations = topProducts.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      category: product.category,
      basePremium: product.base_premium,
      coverages: product.coverages,
      reason: reasons[product.id] || 'Recommandé pour votre profil',
      similarityScore: Math.min(95, Math.round(40 + product.score)),
      usersCount: coOccurrence[product.id] || 0
    }));

    console.log('Final recommendations:', recommendations.length);

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});