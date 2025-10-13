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
    const { imageBase64, documentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    console.log('OCR request received for type:', documentType);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!imageBase64) {
      throw new Error('No image provided');
    }

    // Ensure proper data URL format
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    console.log('Image URL format check:', imageUrl.substring(0, 50));

    const systemPrompt = `Tu es un assistant OCR expert pour extraire des informations de documents d'assurance.
Analyse attentivement l'image fournie et:
1. Extrait toutes les informations textuelles pertinentes
2. IDENTIFIE VISUELLEMENT les zones endommagées visibles sur l'image
3. Pour chaque zone endommagée, détermine:
   - Le type de dommage (Choc, Bris de vitre, Rayure, Feu, Inondation, Vol, Autre)
   - La gravité estimée de 1 (léger) à 5 (très grave)
   - Une description détaillée des dégâts observés
4. Pour un véhicule (Auto), identifie les parties endommagées parmi: Pare-chocs avant, Capot, Pare-brise, Toit, Portière avant gauche, Portière avant droite, Portière arrière gauche, Portière arrière droite, Coffre, Pare-chocs arrière
5. Pour une habitation, identifie les parties endommagées parmi: Toiture, Façade, Fenêtres, Portes, Garage, Jardin

IMPORTANT: Analyse visuellement les dégâts visibles dans l'image et fournis des détails complets pour chaque zone endommagée.
Type de document: ${documentType || 'inconnu'}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_claim_data',
            description: 'Extraire les données d\'un document de sinistre et identifier les zones endommagées visibles sur l\'image',
            parameters: {
              type: 'object',
              properties: {
                claimDate: { type: 'string' },
                claimType: { type: 'string' },
                location: { type: 'string' },
                description: { type: 'string' },
                estimatedAmount: { type: 'string' },
                parties: { type: 'array', items: { type: 'string' } },
                extractedText: { type: 'string' },
                damageZones: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: documentType === 'Auto' 
                    ? 'Liste des zones endommagées parmi: Pare-chocs avant, Capot, Pare-brise, Toit, Portière avant gauche, Portière avant droite, Portière arrière gauche, Portière arrière droite, Coffre, Pare-chocs arrière'
                    : 'Liste des zones endommagées parmi: Toiture, Façade, Fenêtres, Portes, Garage, Jardin'
                },
                damageDetails: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      zone: { type: 'string', description: 'Nom de la zone endommagée' },
                      damageType: { type: 'string', enum: ['Choc', 'Bris de vitre', 'Rayure', 'Feu', 'Inondation', 'Vol', 'Autre'], description: 'Type de dommage observé' },
                      severity: { type: 'number', minimum: 1, maximum: 5, description: 'Gravité estimée de 1 (léger) à 5 (très grave)' },
                      notes: { type: 'string', description: 'Description détaillée des dégâts observés sur cette zone' }
                    },
                    required: ['zone', 'damageType', 'severity', 'notes']
                  },
                  description: 'Détails complets pour chaque zone endommagée avec type, gravité et notes'
                }
              },
              required: ['extractedText', 'damageZones', 'damageDetails']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_claim_data' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OCR AI error:', response.status, errorText);
      throw new Error(`OCR processing failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(data, null, 2));
      throw new Error('No data extracted');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Data extracted successfully:', Object.keys(extractedData));

    // Calculer la confiance IA basée sur la qualité des données extraites
    let confidence = 0.5; // Baseline
    
    // Augmenter la confiance si on a des données structurées
    if (extractedData.damageDetails && extractedData.damageDetails.length > 0) {
      confidence += 0.2;
    }
    if (extractedData.damageZones && extractedData.damageZones.length > 0) {
      confidence += 0.15;
    }
    if (extractedData.extractedText && extractedData.extractedText.length > 50) {
      confidence += 0.1;
    }
    if (extractedData.estimatedAmount) {
      confidence += 0.05;
    }
    
    // S'assurer que la confiance reste entre 0 et 1
    confidence = Math.min(Math.max(confidence, 0), 1);
    
    console.log('Calculated AI confidence:', confidence);

    return new Response(JSON.stringify({
      ...extractedData,
      ai_confidence: confidence
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ocr-claim:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
