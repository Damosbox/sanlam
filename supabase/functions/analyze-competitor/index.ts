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
    const { documentText, documentType, filename, competitorName, productId } = await req.json();
    
    console.log('Starting competitive analysis for:', filename);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get our internal product data for comparison
    let products;
    let selectedProduct = null;
    
    if (productId) {
      // Fetch specific product
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Produit sélectionné non trouvé' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      selectedProduct = product;
      products = [product];
    } else {
      // Fetch all products for auto-detection
      const { data: allProducts, error: productsError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (productsError) {
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }
      
      products = allProducts;
    }

    const systemPrompt = `Tu es un expert en analyse concurrentielle dans le secteur de l'assurance en Côte d'Ivoire.
Ton rôle est d'analyser une fiche produit concurrent et de la comparer avec nos produits internes.

${productId ? 
  `Produit à comparer (sélectionné par l'utilisateur):
${JSON.stringify(selectedProduct, null, 2)}` 
  : 
  `Nos produits disponibles:
${JSON.stringify(products, null, 2)}

Tu dois d'abord identifier automatiquement le type de produit concurrent (vie ou non-vie) et déterminer quel produit de notre catalogue correspond le mieux pour la comparaison.
Si aucun produit ne correspond au type identifié, tu dois retourner product_not_found: true avec un message explicatif.`
}

Instructions:
1. Extraire du document concurrent: garanties, exclusions, tarifs, segments cibles, canaux de distribution, conditions de souscription.
2. ${productId ? 'Comparer avec le produit sélectionné.' : 'Identifier automatiquement le type de produit (vie ou non-vie) du concurrent et trouver le produit correspondant dans notre catalogue.'}
3. Attribuer des scores de positionnement (0-100) pour chaque critère avec EXPLICATION DÉTAILLÉE:
   - prix: Score du concurrent sur le prix (100 = très compétitif, 0 = très cher)
   - garanties: Étendue et qualité des garanties du concurrent
   - service: Qualité du service client du concurrent
   - réseau: Étendue du réseau de distribution
   - digitalisation: Niveau de digitalisation
   - valeur_ajoutee: Services additionnels proposés
   
   IMPORTANT: Pour chaque score, fournis une "explanation" qui détaille POURQUOI ce score, en comparant le concurrent à notre produit de façon concrète.
   
4. Identifier forces et faiblesses du concurrent PAR RAPPORT À NOTRE PRODUIT.
5. Générer des arguments commerciaux prêts à utiliser pour VALORISER NOTRE PRODUIT face au concurrent.
6. Proposer des recommandations d'actions concrètes pour nous différencier.

Sois précis, factuel et orienté action commerciale.`;

    const userPrompt = `Analyse ce document produit concurrent :

Type de document : ${documentType}
Nom du fichier : ${filename}
${competitorName ? `Concurrent : ${competitorName}` : ''}

Contenu du document :
${documentText}

Fournis une analyse complète structurée.`;

    const requestBody = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "provide_competitive_analysis",
            description: "Fournir une analyse concurrentielle structurée d'un produit d'assurance",
            parameters: {
              type: "object",
              properties: {
                product_not_found: { type: "boolean", description: "True si aucun produit ne correspond au type identifié" },
                product_not_found_message: { type: "string", description: "Message explicatif si produit non trouvé" },
                detected_type: { type: "string", description: "Type de produit détecté: vie ou non-vie" },
                compared_product: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    category: { type: "string" },
                    description: { type: "string" }
                  }
                },
                extracted_data: {
                  type: "object",
                  properties: {
                    garanties: { type: "array", items: { type: "string" } },
                    exclusions: { type: "array", items: { type: "string" } },
                    tarifs: { type: "string" },
                    segments_cibles: { type: "array", items: { type: "string" } },
                    canaux_distribution: { type: "array", items: { type: "string" } },
                    conditions_souscription: { type: "array", items: { type: "string" } },
                    escomptes: { type: "array", items: { type: "string" } },
                    packaging: { type: "string" }
                  },
                  required: ["garanties", "exclusions", "tarifs"]
                },
                positioning_scores: {
                  type: "object",
                  properties: {
                    prix: { 
                      type: "object",
                      properties: {
                        score: { type: "number", minimum: 0, maximum: 100 },
                        explanation: { type: "string" }
                      },
                      required: ["score", "explanation"]
                    },
                    garanties: { 
                      type: "object",
                      properties: {
                        score: { type: "number", minimum: 0, maximum: 100 },
                        explanation: { type: "string" }
                      },
                      required: ["score", "explanation"]
                    },
                    service: { 
                      type: "object",
                      properties: {
                        score: { type: "number", minimum: 0, maximum: 100 },
                        explanation: { type: "string" }
                      },
                      required: ["score", "explanation"]
                    },
                    reseau: { 
                      type: "object",
                      properties: {
                        score: { type: "number", minimum: 0, maximum: 100 },
                        explanation: { type: "string" }
                      },
                      required: ["score", "explanation"]
                    },
                    digitalisation: { 
                      type: "object",
                      properties: {
                        score: { type: "number", minimum: 0, maximum: 100 },
                        explanation: { type: "string" }
                      },
                      required: ["score", "explanation"]
                    },
                    valeur_ajoutee: { 
                      type: "object",
                      properties: {
                        score: { type: "number", minimum: 0, maximum: 100 },
                        explanation: { type: "string" }
                      },
                      required: ["score", "explanation"]
                    }
                  },
                  required: ["prix", "garanties", "service", "reseau", "digitalisation", "valeur_ajoutee"]
                },
                strengths: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titre: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string", enum: ["faible", "moyen", "élevé"] }
                    },
                    required: ["titre", "description", "impact"]
                  }
                },
                weaknesses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titre: { type: "string" },
                      description: { type: "string" },
                      opportunite: { type: "string" }
                    },
                    required: ["titre", "description", "opportunite"]
                  }
                },
                commercial_arguments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      argument: { type: "string" },
                      contexte: { type: "string" },
                      phrase_type: { type: "string" }
                    },
                    required: ["argument", "contexte", "phrase_type"]
                  }
                },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titre: { type: "string" },
                      description: { type: "string" },
                      priorite: { type: "string", enum: ["faible", "moyenne", "haute"] },
                      action_concrete: { type: "string" }
                    },
                    required: ["titre", "description", "priorite", "action_concrete"]
                  }
                },
                comparison_table: {
                  type: "object",
                  properties: {
                    criteres: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          nom: { type: "string" },
                          concurrent: { type: "string" },
                          nous: { type: "string" },
                          avantage: { type: "string", enum: ["concurrent", "nous", "égalité"] }
                        },
                        required: ["nom", "concurrent", "nous", "avantage"]
                      }
                    }
                  },
                  required: ["criteres"]
                }
              },
              required: ["extracted_data", "positioning_scores", "strengths", "weaknesses", "commercial_arguments", "recommendations", "comparison_table"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "provide_competitive_analysis" } }
    };

    console.log('Calling Lovable AI Gateway...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes dépassée. Veuillez réessayer plus tard.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits insuffisants. Veuillez recharger votre compte Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Analysis extracted successfully');

    // Save to database
    const { data: savedAnalysis, error: dbError } = await supabaseClient
      .from('competitive_analyses')
      .insert({
        created_by: user.id,
        competitor_name: competitorName,
        document_type: documentType,
        original_filename: filename,
        extracted_data: analysis.extracted_data,
        positioning_scores: analysis.positioning_scores,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        commercial_arguments: analysis.commercial_arguments,
        recommendations: analysis.recommendations,
        comparison_table: analysis.comparison_table,
        status: 'completed'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Analysis saved to database');

    return new Response(
      JSON.stringify({ success: true, analysis: savedAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-competitor function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});