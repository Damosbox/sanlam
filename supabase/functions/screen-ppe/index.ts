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

interface ScreeningResult {
  // PPE Results
  isPPE: boolean;
  ppePosition?: string;
  ppeCountry?: string;
  ppeRelationship?: string;
  // AML Results  
  amlRiskLevel: 'low' | 'medium' | 'high';
  amlFlags: string[];
  // Meta
  source: string;
  reference: string;
}

// Simulated PPE database for demo purposes
const simulatedPPEDatabase = [
  { 
    pattern: /^(paul|jean|pierre)\s+(biya|kagame|sassou)/i,
    isPPE: true,
    position: "Chef d'État",
    country: "Afrique Centrale",
    relationship: "lui_meme"
  },
  {
    pattern: /ministre|president|premier|senateur|depute/i,
    isPPE: true,
    position: "Fonction gouvernementale",
    country: "Non spécifié",
    relationship: "lui_meme"
  }
];

// Simulated AML risk factors
const amlRiskFactors = [
  { pattern: /offshore|panama|caiman|jersey/i, flag: "Juridiction à risque", riskIncrease: 1 },
  { pattern: /crypto|bitcoin|ethereum/i, flag: "Activités crypto", riskIncrease: 0.5 },
  { pattern: /cash|espece|liquide/i, flag: "Transactions en espèces", riskIncrease: 0.5 },
];

function performScreening(firstName: string, lastName: string, nationality?: string): ScreeningResult {
  const fullName = `${firstName} ${lastName}`;
  const reference = `LCB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  
  // PPE Check
  let isPPE = false;
  let ppePosition: string | undefined;
  let ppeCountry: string | undefined;
  let ppeRelationship: string | undefined;

  for (const entry of simulatedPPEDatabase) {
    if (entry.pattern.test(fullName)) {
      isPPE = true;
      ppePosition = entry.position;
      ppeCountry = entry.country;
      ppeRelationship = entry.relationship;
      break;
    }
  }

  // AML Check
  const amlFlags: string[] = [];
  let riskScore = 0;

  // Base risk from nationality (simulated)
  const highRiskCountries = ['russia', 'iran', 'north korea', 'syria'];
  if (nationality && highRiskCountries.some(c => nationality.toLowerCase().includes(c))) {
    amlFlags.push("Pays à risque élevé");
    riskScore += 2;
  }

  // Check name against sanctions patterns (simulated)
  for (const factor of amlRiskFactors) {
    if (factor.pattern.test(fullName)) {
      amlFlags.push(factor.flag);
      riskScore += factor.riskIncrease;
    }
  }

  // PPE increases AML risk
  if (isPPE) {
    amlFlags.push("Personne Politiquement Exposée");
    riskScore += 1;
  }

  // Determine risk level
  let amlRiskLevel: 'low' | 'medium' | 'high';
  if (riskScore >= 2) {
    amlRiskLevel = 'high';
  } else if (riskScore >= 1) {
    amlRiskLevel = 'medium';
  } else {
    amlRiskLevel = 'low';
  }

  return {
    isPPE,
    ppePosition,
    ppeCountry,
    ppeRelationship,
    amlRiskLevel,
    amlFlags,
    source: "LCB-FT Screening Service (Simulation)",
    reference
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

    // Perform the unified screening (PPE + AML)
    const result = performScreening(firstName, lastName, nationality);

    // Update the database with results
    const updateData = {
      // PPE data
      is_ppe: result.isPPE,
      ppe_position: result.ppePosition || null,
      ppe_country: result.ppeCountry || null,
      ppe_relationship: result.ppeRelationship || null,
      ppe_screening_status: 'completed',
      ppe_screening_date: new Date().toISOString(),
      ppe_screening_source: result.source,
      ppe_screening_reference: result.reference,
      // AML data - automatically set from screening
      aml_verified: true,
      aml_verified_at: new Date().toISOString(),
      aml_risk_level: result.amlRiskLevel,
      aml_notes: result.amlFlags.length > 0 
        ? `Flags détectés: ${result.amlFlags.join(', ')}`
        : 'Aucun flag détecté',
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
          // PPE
          isPPE: result.isPPE,
          ppePosition: result.ppePosition,
          ppeCountry: result.ppeCountry,
          ppeRelationship: result.ppeRelationship,
          // AML
          amlRiskLevel: result.amlRiskLevel,
          amlFlags: result.amlFlags,
          // Meta
          screeningDate: new Date().toISOString(),
          source: result.source,
          reference: result.reference
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('LCB-FT Screening error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
