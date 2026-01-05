import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, documentType } = await req.json();

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

    const systemPrompt = `Tu es un expert en extraction de données de documents d'identité africains (CNI, Passeport, Carte consulaire).
Analyse l'image fournie et extrait les informations suivantes de manière structurée:
- Nom de famille
- Prénom(s)
- Numéro de la pièce d'identité
- Type de document (CNI, Passeport, Carte consulaire, Permis de conduire, Autre)
- Date de naissance (format: YYYY-MM-DD)
- Date d'expiration (format: YYYY-MM-DD) si visible
- Nationalité si visible

Retourne les données en utilisant la fonction extract_identity_data.`;

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
                text: `Analyse ce document d'identité${documentType ? ` (type attendu: ${documentType})` : ""} et extrait les informations.`,
              },
              {
                type: "image_url",
                image_url: { 
                  url: imageBase64.startsWith("data:") 
                    ? imageBase64 
                    : `data:image/jpeg;base64,${imageBase64}` 
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_identity_data",
              description: "Extrait les données structurées d'un document d'identité",
              parameters: {
                type: "object",
                properties: {
                  lastName: { type: "string", description: "Nom de famille" },
                  firstName: { type: "string", description: "Prénom(s)" },
                  documentNumber: { type: "string", description: "Numéro du document" },
                  documentType: {
                    type: "string",
                    enum: ["CNI", "Passeport", "Carte consulaire", "Permis de conduire", "Autre"],
                    description: "Type de document",
                  },
                  birthDate: { type: "string", description: "Date de naissance (YYYY-MM-DD)" },
                  expiryDate: { type: "string", description: "Date d'expiration (YYYY-MM-DD)" },
                  nationality: { type: "string", description: "Nationalité" },
                  confidence: {
                    type: "number",
                    description: "Score de confiance de 0 à 1",
                  },
                },
                required: ["lastName", "firstName", "documentNumber", "documentType", "confidence"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_identity_data" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
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
          error: "Impossible d'extraire les données du document",
          extracted: null,
          confidence: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    
    console.log("OCR Identity extracted:", extractedData);

    return new Response(
      JSON.stringify({
        extracted: extractedData,
        confidence: extractedData.confidence || 0.8,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("OCR Identity error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur interne";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
