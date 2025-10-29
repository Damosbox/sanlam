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
    const { 
      documentText, 
      documentType, 
      filename, 
      competitorName, 
      productId,
      clientContext,
      companyStrengths,
      sourceUrl 
    } = await req.json();
    
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

    // Default company strengths for Sanlam Allianz
    const defaultCompanyStrengths = `
- Délai moyen de règlement < 10 jours sur sinistres simples
- Réseau garages agréés 300+ en Côte d'Ivoire
- Application mobile sinistre 24/7 avec géolocalisation
- Solidité financière avérée (Sanlam Allianz)
- Notation locale excellente
- Partenariats santé exclusifs
`;

    const systemPrompt = `Tu es un expert en analyse concurrentielle et vente consultative dans le secteur de l'assurance en Côte d'Ivoire (Zone CIMA).

FRAMEWORKS DE VENTE À INTÉGRER :

1. SPIN Selling : Générer 2-3 questions pour chaque catégorie
   - Situation : État actuel du client
   - Problème : Points de douleur avec solution actuelle
   - Implication : Conséquences de ces problèmes
   - Need-Payoff : Bénéfices de notre solution

2. Challenger Sale : Créer une "teaching insight"
   - Recadrer le problème (ex: coût sinistre mal géré > prime économisée)
   - Tailoring au segment client
   - Take control avec prochaine étape claire

3. Cialdini (6 principes d'influence) :
   - Autorité : Utiliser certifications/notation Box Africa
   - Preuve sociale : Cas clients locaux similaires
   - Réciprocité : Offre d'audit gratuit
   - Rareté : Fenêtre tarifaire limitée
   - Engagement : Mini-engagement (diagnostic)
   - Sympathie : Ton chaleureux, professionnel

AXES D'ANALYSE (au-delà du prix) avec scores 0-10 :
1. Couverture & exclusions (clarté, trous, options)
2. Expérience sinistre & service (délais, canaux, transparence)
3. Valeur & TCoR (prévention, assistance, digital, rétention)
4. Conformité CIMA & transparence (info précontractuelle, adéquation)

ATOUTS ENTREPRISE SANLAM ALLIANZ :
${companyStrengths || defaultCompanyStrengths}

${clientContext ? `CONTEXTE CLIENT :
${clientContext}` : ''}

${productId ? 
  `Produit à comparer (sélectionné par l'utilisateur):
${JSON.stringify(selectedProduct, null, 2)}` 
  : 
  `Nos produits disponibles:
${JSON.stringify(products, null, 2)}

Tu dois d'abord identifier automatiquement le type de produit concurrent (vie ou non-vie) et déterminer quel produit de notre catalogue correspond le mieux pour la comparaison.
Si aucun produit ne correspond au type identifié, tu dois retourner product_not_found: true avec un message explicatif.`
}

IMPORTANT - Conformité CIMA :
- Toujours mentionner la transparence réglementaire
- Rappeler l'adéquation besoin/produit
- Citer les exigences CIMA pertinentes

Instructions détaillées :
1. Extraire du document concurrent: garanties, exclusions, tarifs, segments cibles, canaux de distribution, conditions de souscription.
2. ${productId ? 'Comparer avec le produit sélectionné.' : 'Identifier automatiquement le type de produit (vie ou non-vie) du concurrent et trouver le produit correspondant dans notre catalogue.'}
3. Attribuer des scores de positionnement (0-100) pour chaque critère avec EXPLICATION DÉTAILLÉE.
4. Générer les questions SPIN (2-3 par catégorie).
5. Créer la teaching insight (Challenger).
6. Intégrer les éléments Cialdini naturellement.
7. Quantifier la valeur (gains temps, services, coût total du risque).
8. Anticiper et répondre aux 3 objections principales.
9. Proposer une offre recommandée avec bonus réciprocité.
10. Inclure les mentions de conformité CIMA.

Sois précis, factuel, orienté persuasion et action commerciale.`;

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
                },
                spin_questions: {
                  type: "object",
                  properties: {
                    situation: { type: "array", items: { type: "string" } },
                    probleme: { type: "array", items: { type: "string" } },
                    implication: { type: "array", items: { type: "string" } },
                    need_payoff: { type: "array", items: { type: "string" } }
                  },
                  required: ["situation", "probleme", "implication", "need_payoff"]
                },
                teaching_insight: {
                  type: "object",
                  properties: {
                    titre: { type: "string" },
                    recadrage_probleme: { type: "string" },
                    tailoring_segment: { type: "string" },
                    prochaine_etape: { type: "string" }
                  },
                  required: ["titre", "recadrage_probleme", "tailoring_segment", "prochaine_etape"]
                },
                cialdini_elements: {
                  type: "object",
                  properties: {
                    autorite: {
                      type: "object",
                      properties: {
                        texte: { type: "string" },
                        source: { type: "string" }
                      }
                    },
                    preuve_sociale: {
                      type: "object",
                      properties: {
                        cas_client: { type: "string" },
                        chiffres: { type: "string" }
                      }
                    },
                    reciprocite: {
                      type: "object",
                      properties: {
                        offre: { type: "string" },
                        valeur: { type: "string" }
                      }
                    },
                    rarete: {
                      type: "object",
                      properties: {
                        limitation: { type: "string" },
                        urgence: { type: "string" }
                      }
                    },
                    engagement: {
                      type: "object",
                      properties: {
                        mini_action: { type: "string" }
                      }
                    }
                  }
                },
                quantification_valeur: {
                  type: "object",
                  properties: {
                    gain_temps_sinistre: { type: "string" },
                    valeur_services: { type: "string" },
                    sources: { type: "array", items: { type: "string" } }
                  }
                },
                top_3_objections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      objection: { type: "string" },
                      reponse: { type: "string" },
                      preuve: { type: "string" }
                    },
                    required: ["objection", "reponse", "preuve"]
                  }
                },
                offre_recommandee: {
                  type: "object",
                  properties: {
                    pack: { type: "string" },
                    option_principale: { type: "string" },
                    bonus_reciprocite: { type: "string" },
                    appel_action: { type: "string" }
                  }
                },
                conformite_cima: {
                  type: "object",
                  properties: {
                    mentions: { type: "array", items: { type: "string" } },
                    transparence: { type: "string" }
                  }
                },
                experience_sinistre: {
                  type: "object",
                  properties: {
                    delai: { type: "string" },
                    canaux: { type: "string" },
                    transparence: { type: "string" }
                  }
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

    // Save to database with new fields
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
        client_context: clientContext,
        company_strengths: companyStrengths,
        source_urls: sourceUrl ? [sourceUrl] : null,
        analysis_timestamp: new Date().toISOString(),
        parameters: {
          spin_questions: analysis.spin_questions,
          teaching_insight: analysis.teaching_insight,
          cialdini_elements: analysis.cialdini_elements,
          quantification_valeur: analysis.quantification_valeur,
          top_3_objections: analysis.top_3_objections,
          offre_recommandee: analysis.offre_recommandee,
          conformite_cima: analysis.conformite_cima,
          experience_sinistre: analysis.experience_sinistre
        },
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