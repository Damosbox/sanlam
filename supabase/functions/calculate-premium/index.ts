import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Coverage {
  included: boolean;
  limit?: string;
  description?: string;
  optional?: boolean;
  price_modifier?: number;
}

interface UserProfile {
  age?: number;
  location?: string;
  driving_experience?: number;
  family_size?: number;
  property_value?: number;
  health_history?: string;
}

interface CalculatePremiumRequest {
  product_id: string;
  base_premium: number;
  selected_coverages: Record<string, Coverage>;
  user_profile?: UserProfile;
}

interface PremiumBreakdown {
  base_premium: number;
  coverage_adjustments: Array<{
    coverage: string;
    amount: number;
    description: string;
  }>;
  profile_adjustments: Array<{
    factor: string;
    percentage: number;
    amount: number;
    description: string;
  }>;
  subtotal: number;
  monthly_premium: number;
  annual_premium: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Calculate premium function called');
    
    const { 
      product_id, 
      base_premium, 
      selected_coverages, 
      user_profile 
    }: CalculatePremiumRequest = await req.json();

    console.log('Request data:', { product_id, base_premium, coverages_count: Object.keys(selected_coverages).length });

    // Start with base premium
    let premium = base_premium;
    const coverageAdjustments: PremiumBreakdown['coverage_adjustments'] = [];
    const profileAdjustments: PremiumBreakdown['profile_adjustments'] = [];

    // Add coverage modifiers
    for (const [key, coverage] of Object.entries(selected_coverages)) {
      if (coverage.included && coverage.price_modifier && coverage.price_modifier !== 0) {
        premium += coverage.price_modifier;
        coverageAdjustments.push({
          coverage: coverage.description || key,
          amount: coverage.price_modifier,
          description: `Garantie ${coverage.description || key}`
        });
      }
    }

    const subtotal = premium;

    // Apply AI-driven profile adjustments if user profile provided
    if (user_profile) {
      console.log('Applying profile adjustments:', user_profile);

      // Age factor (for auto insurance)
      if (user_profile.age) {
        if (user_profile.age < 25) {
          const adjustment = premium * 0.15;
          premium += adjustment;
          profileAdjustments.push({
            factor: 'age_young_driver',
            percentage: 15,
            amount: adjustment,
            description: 'Jeune conducteur (<25 ans)'
          });
        } else if (user_profile.age > 60) {
          const adjustment = premium * 0.08;
          premium += adjustment;
          profileAdjustments.push({
            factor: 'age_senior',
            percentage: 8,
            amount: adjustment,
            description: 'Conducteur sénior (>60 ans)'
          });
        } else if (user_profile.age >= 30 && user_profile.age <= 50) {
          const adjustment = premium * -0.05;
          premium += adjustment;
          profileAdjustments.push({
            factor: 'age_experienced',
            percentage: -5,
            amount: adjustment,
            description: 'Conducteur expérimenté (30-50 ans)'
          });
        }
      }

      // Driving experience (for auto insurance)
      if (user_profile.driving_experience !== undefined) {
        if (user_profile.driving_experience >= 10) {
          const adjustment = premium * -0.10;
          premium += adjustment;
          profileAdjustments.push({
            factor: 'experience_bonus',
            percentage: -10,
            amount: adjustment,
            description: 'Bonus expérience (+10 ans)'
          });
        } else if (user_profile.driving_experience < 3) {
          const adjustment = premium * 0.12;
          premium += adjustment;
          profileAdjustments.push({
            factor: 'experience_novice',
            percentage: 12,
            amount: adjustment,
            description: 'Conducteur débutant (<3 ans)'
          });
        }
      }

      // Location factor (risk zone)
      if (user_profile.location) {
        const highRiskZones = ['Abidjan', 'Bouaké', 'Daloa'];
        if (highRiskZones.includes(user_profile.location)) {
          const adjustment = premium * 0.08;
          premium += adjustment;
          profileAdjustments.push({
            factor: 'location_high_risk',
            percentage: 8,
            amount: adjustment,
            description: `Zone à risque élevé (${user_profile.location})`
          });
        } else {
          const adjustment = premium * -0.05;
          premium += adjustment;
          profileAdjustments.push({
            factor: 'location_low_risk',
            percentage: -5,
            amount: adjustment,
            description: 'Zone à risque faible'
          });
        }
      }

      // Family size (for health insurance)
      if (user_profile.family_size && user_profile.family_size > 4) {
        const adjustment = premium * -0.07;
        premium += adjustment;
        profileAdjustments.push({
          factor: 'family_discount',
          percentage: -7,
          amount: adjustment,
          description: 'Réduction famille nombreuse'
        });
      }

      // Property value (for home insurance)
      if (user_profile.property_value) {
        if (user_profile.property_value > 50000000) {
          const adjustment = premium * 0.15;
          premium += adjustment;
          profileAdjustments.push({
            factor: 'high_property_value',
            percentage: 15,
            amount: adjustment,
            description: 'Bien de valeur élevée'
          });
        }
      }

      // Health history (for health insurance)
      if (user_profile.health_history === 'excellent') {
        const adjustment = premium * -0.10;
        premium += adjustment;
        profileAdjustments.push({
          factor: 'health_excellent',
          percentage: -10,
          amount: adjustment,
          description: 'Excellent historique santé'
        });
      }
    }

    // Round to nearest integer
    const monthlyPremium = Math.round(premium);
    const annualPremium = Math.round(premium * 12);

    const breakdown: PremiumBreakdown = {
      base_premium: base_premium,
      coverage_adjustments: coverageAdjustments,
      profile_adjustments: profileAdjustments,
      subtotal: Math.round(subtotal),
      monthly_premium: monthlyPremium,
      annual_premium: annualPremium
    };

    console.log('Premium calculated:', { monthlyPremium, annualPremium });

    return new Response(
      JSON.stringify({
        monthly_premium: monthlyPremium,
        annual_premium: annualPremium,
        breakdown
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error calculating premium:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate premium',
        details: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
