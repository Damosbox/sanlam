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
Analyse le document et extrait les informations structurées pertinentes.
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
            description: 'Extraire les données d\'un document de sinistre',
            parameters: {
              type: 'object',
              properties: {
                claimDate: { type: 'string' },
                claimType: { type: 'string' },
                location: { type: 'string' },
                description: { type: 'string' },
                estimatedAmount: { type: 'string' },
                parties: { type: 'array', items: { type: 'string' } },
                extractedText: { type: 'string' }
              },
              required: ['extractedText']
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

    return new Response(JSON.stringify(extractedData), {
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
