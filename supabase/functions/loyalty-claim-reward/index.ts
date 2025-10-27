import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateRedemptionCode() {
  return 'RWD' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

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

    const { rewardId } = await req.json();

    console.log('Claiming reward:', rewardId, 'for user:', user.id);

    // Fetch reward details
    const { data: reward } = await supabaseClient
      .from('loyalty_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (!reward || !reward.is_active) {
      throw new Error('Récompense non disponible');
    }

    // Check stock
    if (reward.stock_available !== null && reward.stock_available <= 0) {
      throw new Error('Stock épuisé');
    }

    // Fetch user loyalty profile
    const { data: loyaltyProfile } = await supabaseClient
      .from('loyalty_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!loyaltyProfile) {
      throw new Error('Profil fidélité introuvable');
    }

    // Check if user has enough points
    if (loyaltyProfile.total_points < reward.cost_in_points) {
      throw new Error('Points insuffisants');
    }

    // Check level requirement
    const levelOrder: Record<string, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
    if (levelOrder[loyaltyProfile.current_level] < levelOrder[reward.required_level]) {
      throw new Error('Niveau insuffisant');
    }

    // Deduct points
    const newPoints = loyaltyProfile.total_points - reward.cost_in_points;

    const { error: updateError } = await supabaseClient
      .from('loyalty_profiles')
      .update({ total_points: newPoints })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Record transaction
    await supabaseClient
      .from('loyalty_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'spent',
        points_amount: -reward.cost_in_points,
        source_type: 'reward',
        source_id: rewardId,
        description: `Récompense réclamée: ${reward.name}`,
      });

    // Create user reward
    const expiresAt = reward.expiry_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: userReward } = await supabaseClient
      .from('user_rewards')
      .insert({
        user_id: user.id,
        reward_id: rewardId,
        status: 'active',
        redemption_code: generateRedemptionCode(),
        expires_at: expiresAt,
      })
      .select()
      .single();

    // Update stock if applicable
    if (reward.stock_available !== null) {
      await supabaseClient
        .from('loyalty_rewards')
        .update({ stock_available: reward.stock_available - 1 })
        .eq('id', rewardId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userReward,
        newPoints,
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