import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScreeningRequest {
  clientId: string;
  entityType: 'client' | 'lead';
  firstName: string;
  lastName: string;
  birthDate?: string;
  nationality?: string;
}

interface PPEResult {
  isPPE: boolean;
  position?: string;
  country?: string;
  relationship?: string;
  source: string;
  reference: string;
}

// Simulated PPE database for demo purposes
// In production, this would call WorldCheck, ComplyAdvantage, or similar services
const simulatedPPEDatabase = [
  { 
    pattern: /^(paul|jean|pierre)\s+(biya|kagame|sassou)/i,
    isPPE: true,
    position: "Chef d'État",
    country: "Afrique Centrale",
    relationship: "lui_meme"
  },
  {
    pattern: /ministre|president|premier/i,
    isPPE: true,
    position: "Fonction gouvernementale",
    country: "Non spécifié",
    relationship: "lui_meme"
  }
];

function performPPEScreening(firstName: string, lastName: string): PPEResult {
  const fullName = `${firstName} ${lastName}`;
  
  // Check against simulated database
  for (const entry of simulatedPPEDatabase) {
    if (entry.pattern.test(fullName)) {
      return {
        isPPE: true,
        position: entry.position,
        country: entry.country,
        relationship: entry.relationship,
        source: "WorldCheck Simulation",
        reference: `WC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
      };
    }
  }

  // No match found - person is not a PPE
  return {
    isPPE: false,
    source: "WorldCheck Simulation",
    reference: `WC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clientId, entityType, firstName, lastName, birthDate, nationality }: ScreeningRequest = await req.json();

    if (!clientId || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'clientId, firstName, and lastName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tableName = entityType === 'lead' ? 'lead_kyc_compliance' : 'client_kyc_compliance';
    const idField = entityType === 'lead' ? 'lead_id' : 'client_id';

    // Update status to in_progress
    await supabase
      .from(tableName)
      .update({ ppe_screening_status: 'in_progress' })
      .eq(idField, clientId);

    // Simulate processing delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Perform the screening
    const result = performPPEScreening(firstName, lastName);

    // Update the database with results
    const updateData = {
      is_ppe: result.isPPE,
      ppe_position: result.position || null,
      ppe_country: result.country || null,
      ppe_relationship: result.relationship || null,
      ppe_screening_status: 'completed',
      ppe_screening_date: new Date().toISOString(),
      ppe_screening_source: result.source,
      ppe_screening_reference: result.reference,
      updated_at: new Date().toISOString()
    };

    // Check if record exists
    const { data: existingRecord } = await supabase
      .from(tableName)
      .select('id')
      .eq(idField, clientId)
      .single();

    if (existingRecord) {
      await supabase
        .from(tableName)
        .update(updateData)
        .eq(idField, clientId);
    } else {
      await supabase
        .from(tableName)
        .insert({
          [idField]: clientId,
          ...updateData
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          isPPE: result.isPPE,
          position: result.position,
          country: result.country,
          relationship: result.relationship,
          screeningDate: new Date().toISOString(),
          source: result.source,
          reference: result.reference
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PPE Screening error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
