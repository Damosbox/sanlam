import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, entityType, entityId, entityName } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image base64 required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en extraction de données de cartes grises / certificats d'immatriculation de véhicules, notamment les documents africains (Côte d'Ivoire, CEDEAO).
Analyse l'image fournie, extrait les informations ET évalue l'authenticité du document :
- Marque du véhicule (ex: Toyota, Hyundai, Peugeot)
- Modèle du véhicule (ex: Corolla, Tucson, 308)
- Numéro d'immatriculation (ex: AB 1234 CD)
- Numéro de châssis / VIN
- Date de première mise en circulation (format: YYYY-MM-DD) si visible

Authenticité : qualité image, alignements, signes d'altération, cohérence VIN.
Statuts : "authentic", "suspicious", "fake", "unverified".

Retourne les données en utilisant la fonction extract_vehicle_data.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyse cette carte grise / certificat d'immatriculation et extrait les informations du véhicule.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:")
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_vehicle_data",
              description: "Extrait les données structurées d'une carte grise / certificat d'immatriculation",
              parameters: {
                type: "object",
                properties: {
                  vehicleBrand: { type: "string", description: "Marque du véhicule" },
                  vehicleModel: { type: "string", description: "Modèle du véhicule" },
                  registrationNumber: { type: "string", description: "Numéro d'immatriculation" },
                  chassisNumber: { type: "string", description: "Numéro de châssis / VIN" },
                  firstCirculationDate: { type: "string", description: "Date de première mise en circulation (YYYY-MM-DD)" },
                  confidence: {
                    type: "number",
                    description: "Score de confiance de 0 à 1",
                  },
                  authenticityStatus: {
                    type: "string",
                    enum: ["authentic", "suspicious", "fake", "unverified"],
                    description: "Statut d'authenticité",
                  },
                  authenticityScore: { type: "number", description: "0-100" },
                  authenticityDetails: {
                    type: "object",
                    properties: {
                      imageQuality: { type: "string" },
                      anomaliesDetected: { type: "array", items: { type: "string" } },
                      notes: { type: "string" },
                    },
                  },
                },
                required: ["vehicleBrand", "vehicleModel", "registrationNumber", "chassisNumber", "confidence"],
                additionalProperties: true,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_vehicle_data" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits AI insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'analyse du document" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({
          error: "Impossible d'extraire les données de la carte grise",
          extracted: null,
          confidence: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log("OCR Vehicle Registration extracted:", extractedData);

    // Persist for compliance audit
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        let agentId: string | null = null;
        let agentName: string | null = null;
        const authHeader = req.headers.get("Authorization");
        if (authHeader) {
          const token = authHeader.replace("Bearer ", "");
          const { data: userData } = await supabase.auth.getUser(token);
          if (userData?.user) {
            agentId = userData.user.id;
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, first_name, last_name")
              .eq("id", agentId)
              .maybeSingle();
            agentName = profile?.display_name || `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || null;
          }
        }
        await supabase.from("ocr_scan_results").insert({
          entity_type: entityType || "lead",
          entity_id: entityId || agentId || "00000000-0000-0000-0000-000000000000",
          entity_name: entityName || `${extractedData.vehicleBrand ?? ""} ${extractedData.vehicleModel ?? ""}`.trim(),
          document_type: "CARTE_GRISE",
          extracted_data: extractedData,
          confidence_score: Math.round((extractedData.confidence || 0.8) * 100),
          authenticity_status: extractedData.authenticityStatus || "unverified",
          authenticity_score: extractedData.authenticityScore || 0,
          authenticity_details: extractedData.authenticityDetails || {},
          agent_id: agentId,
          agent_name: agentName,
        });
      }
    } catch (persistErr) {
      console.error("Failed to persist OCR scan:", persistErr);
    }

    return new Response(
      JSON.stringify({
        extracted: extractedData,
        confidence: extractedData.confidence || 0.8,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("OCR Vehicle Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur interne";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
