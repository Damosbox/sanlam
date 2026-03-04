import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

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
Analyse l'image fournie et extrait les informations suivantes de manière structurée:
- Marque du véhicule (ex: Toyota, Hyundai, Peugeot)
- Modèle du véhicule (ex: Corolla, Tucson, 308)
- Numéro d'immatriculation (ex: AB 1234 CD)
- Numéro de châssis / VIN
- Date de première mise en circulation (format: YYYY-MM-DD) si visible

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
                },
                required: ["vehicleBrand", "vehicleModel", "registrationNumber", "chassisNumber", "confidence"],
                additionalProperties: false,
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
