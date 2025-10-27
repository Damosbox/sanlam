import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Non authentifié');
    }

    console.log('Génération de missions IA pour utilisateur:', user.id);

    // Fetch user loyalty profile
    const { data: loyaltyProfile } = await supabaseClient
      .from('loyalty_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch subscriptions
    const { data: subscriptions } = await supabaseClient
      .from('subscriptions')
      .select('*, products(*)')
      .eq('user_id', user.id);

    // Fetch claims
    const { data: claims } = await supabaseClient
      .from('claims')
      .select('*')
      .eq('user_id', user.id);

    // Fetch completed missions
    const { data: completedMissions } = await supabaseClient
      .from('user_missions')
      .select('*, loyalty_missions(*)')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // Calculate behavior score
    const totalClaims = claims?.length || 0;
    const totalSubscriptions = subscriptions?.length || 0;
    const completedCount = completedMissions?.length || 0;

    // Prepare context for AI
    const context = {
      level: loyaltyProfile?.current_level || 'bronze',
      points: loyaltyProfile?.total_points || 0,
      subscriptions: totalSubscriptions,
      subscriptionDetails: subscriptions?.map(s => s.products?.name).join(', ') || 'Aucune',
      claims_count: totalClaims,
      last_claim_date: claims?.[0]?.created_at || 'Jamais',
      missions_completed: completedCount,
      referral_count: loyaltyProfile?.referral_count || 0,
    };

    const systemPrompt = `Tu es un expert en gamification et fidélisation client dans le secteur de l'assurance en Côte d'Ivoire.

Contexte utilisateur :
- Niveau actuel: ${context.level}
- Points: ${context.points}
- Produits souscrits: ${context.subscriptionDetails}
- Nombre de sinistres: ${context.claims_count}
- Missions complétées: ${context.missions_completed}
- Parrainages: ${context.referral_count}

Génère 3-5 missions personnalisées qui :
1. Sont adaptées au profil et comportement
2. Ont une valeur ajoutée claire
3. Sont réalisables dans les 7-30 jours
4. Encouragent des comportements positifs
5. Sont culturellement pertinentes (UEMOA, mobile money, etc.)

Types de missions disponibles: payment, referral, profile_update, quiz, claim_free, social_share, document_upload, subscription, renewal, app_download, survey

Retourne UNIQUEMENT un JSON valide avec ce format exact:
{
  "missions": [
    {
      "name": "...",
      "description": "...",
      "mission_type": "...",
      "points_reward": number,
      "expires_in_days": number,
      "difficulty": "easy|medium|hard",
      "reason": "Pourquoi cette mission pour cet utilisateur"
    }
  ]
}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Génère des missions personnalisées maintenant.' }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', errorText);
      throw new Error('Erreur AI');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de réponse AI invalide');
    }
    
    const parsedMissions = JSON.parse(jsonMatch[0]);
    
    // Create missions in database
    const createdMissions = [];
    for (const mission of parsedMissions.missions) {
      // Check if similar mission already exists and is not recurring
      const { data: existingMissions } = await supabaseClient
        .from('loyalty_missions')
        .select('*')
        .eq('name', mission.name)
        .eq('is_active', true);

      let missionId;
      
      if (existingMissions && existingMissions.length > 0) {
        missionId = existingMissions[0].id;
      } else {
        // Create new mission template
        const { data: newMission } = await supabaseClient
          .from('loyalty_missions')
          .insert({
            name: mission.name,
            description: mission.description,
            mission_type: mission.mission_type,
            points_reward: mission.points_reward,
            is_recurring: false,
            recurrence_period: 'once',
            requirements: {},
            is_active: true,
            priority: 50,
          })
          .select()
          .single();
        
        missionId = newMission?.id;
      }

      if (missionId) {
        // Assign mission to user
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + mission.expires_in_days);

        const { data: userMission } = await supabaseClient
          .from('user_missions')
          .insert({
            user_id: user.id,
            mission_id: missionId,
            status: 'available',
            expires_at: expiresAt.toISOString(),
            progress: 0,
          })
          .select()
          .single();

        createdMissions.push({
          ...mission,
          id: userMission?.id,
          mission_id: missionId,
        });
      }
    }

    console.log('Missions créées:', createdMissions.length);

    return new Response(
      JSON.stringify({ 
        missions: createdMissions,
        context 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});