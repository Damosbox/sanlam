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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { actionType, userId, metadata } = await req.json();

    console.log('Processing loyalty action:', actionType, 'for user:', userId);

    // Fetch user's active missions matching this action type
    const { data: userMissions } = await supabaseClient
      .from('user_missions')
      .select('*, loyalty_missions(*)')
      .eq('user_id', userId)
      .eq('status', 'available')
      .eq('loyalty_missions.mission_type', actionType);

    if (!userMissions || userMissions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucune mission correspondante' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const completedMissions = [];
    const pointsEarned = [];

    for (const userMission of userMissions) {
      const mission = userMission.loyalty_missions;
      
      // Validate action against mission requirements
      let isValid = true;
      const requirements = mission.requirements || {};
      
      // Check specific requirements based on action type
      if (actionType === 'payment' && requirements.on_time) {
        // Verify payment is on time
        isValid = metadata?.onTime === true;
      } else if (actionType === 'referral' && requirements.count) {
        // Check referral count
        const { data: referrals } = await supabaseClient
          .from('referral_tracking')
          .select('*')
          .eq('referrer_id', userId)
          .eq('status', 'completed');
        
        isValid = (referrals?.length || 0) >= requirements.count;
      } else if (actionType === 'profile_update' && requirements.fields) {
        // Verify required fields are completed
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        isValid = requirements.fields.every((field: string) => profile?.[field]);
      }

      if (isValid) {
        // Complete the mission
        const { error: updateError } = await supabaseClient
          .from('user_missions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            progress: 100,
            points_earned: mission.points_reward,
            completion_data: metadata,
          })
          .eq('id', userMission.id);

        if (!updateError) {
          // Award points
          const { data: loyaltyProfile } = await supabaseClient
            .from('loyalty_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          const newPoints = (loyaltyProfile?.total_points || 0) + mission.points_reward;
          const newLifetimePoints = (loyaltyProfile?.lifetime_points || 0) + mission.points_reward;

          await supabaseClient
            .from('loyalty_profiles')
            .update({
              total_points: newPoints,
              lifetime_points: newLifetimePoints,
            })
            .eq('user_id', userId);

          // Record transaction
          await supabaseClient
            .from('loyalty_transactions')
            .insert({
              user_id: userId,
              transaction_type: 'earned',
              points_amount: mission.points_reward,
              source_type: 'mission',
              source_id: userMission.id,
              description: `Mission complétée: ${mission.name}`,
              metadata: metadata,
            });

          // Check for badge reward
          if (mission.badge_reward) {
            const badges = loyaltyProfile?.badges_earned || [];
            if (!badges.some((b: any) => b.id === mission.badge_reward.id)) {
              badges.push(mission.badge_reward);
              await supabaseClient
                .from('loyalty_profiles')
                .update({ badges_earned: badges })
                .eq('user_id', userId);
            }
          }

          completedMissions.push(mission.name);
          pointsEarned.push(mission.points_reward);
        }
      }
    }

    const totalPoints = pointsEarned.reduce((a, b) => a + b, 0);

    return new Response(
      JSON.stringify({
        success: true,
        completedMissions,
        totalPointsEarned: totalPoints,
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