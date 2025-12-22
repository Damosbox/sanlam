import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  mode: "arguments" | "objections" | "competition" | "topic";
  productType: string;
  productName: string;
  premium: number;
  planTier: string;
  topicDescription?: string;
  clientName?: string;
}

const buildPrompt = (body: RequestBody): string => {
  const { mode, productType, productName, premium, planTier, topicDescription, clientName } = body;
  
  const context = `
Tu es un assistant commercial expert en assurance pour Sanlam Assurances Côte d'Ivoire.
Produit: ${productName}
Prime: ${premium.toLocaleString()} FCFA/an
Formule: ${planTier}
Client: ${clientName || "le prospect"}
`;

  switch (mode) {
    case "arguments":
      return `${context}
Génère 3-4 arguments de vente percutants pour convaincre le client de souscrire à ce produit.
Format: liste à puces, concis et orienté bénéfices client.
Adapte les arguments au produit ${productType}.`;

    case "objections":
      return `${context}
Liste les 3-4 objections les plus courantes pour ce type de produit et propose une réponse efficace pour chacune.
Format: 
- Objection: [texte]
  Réponse: [texte]`;

    case "competition":
      return `${context}
Compare brièvement ce produit Sanlam avec la concurrence (NSIA, Allianz, AXA).
Mets en avant 3-4 avantages différenciants de Sanlam.
Reste factuel et professionnel.`;

    case "topic":
      return `${context}
Le commercial a une question sur: ${topicDescription}
Donne une réponse concise et pratique (max 4-5 phrases) pour aider à la vente.
Adapte ta réponse au contexte du produit ${productType}.`;

    default:
      return `${context}
Donne un conseil commercial général pour closer cette vente.`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    console.log("Sales Assistant request:", body.mode, body.productType);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = buildPrompt(body);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant commercial expert. Réponds en français, de manière concise et orientée action. Maximum 150 mots.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Aucune recommandation disponible.";

    console.log("Sales Assistant response generated successfully");

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sales Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
