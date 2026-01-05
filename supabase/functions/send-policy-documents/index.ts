import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentIds, channels, email, phone, policyNumber, subscriptionId } = await req.json();

    console.log("Send policy documents request:", {
      documentIds,
      channels,
      email: email ? "***" : null,
      phone: phone ? "***" : null,
      policyNumber,
      subscriptionId,
    });

    // Validate input
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Aucun document sélectionné" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Aucun canal d'envoi sélectionné" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch documents info
    const { data: documents, error: fetchError } = await supabase
      .from("policy_documents")
      .select("*")
      .in("id", documentIds);

    if (fetchError) {
      console.error("Error fetching documents:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de la récupération des documents" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Documents non trouvés" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${documents.length} documents to send`);

    // Simulate sending documents via each channel
    const sendResults: Record<string, boolean> = {};

    for (const channel of channels) {
      console.log(`Sending via ${channel}...`);
      
      // In a real implementation, you would integrate with:
      // - Email: SendGrid, Resend, AWS SES, etc.
      // - SMS: Twilio, Vonage, etc.
      // - WhatsApp: Twilio WhatsApp API, Meta Business API, etc.
      
      switch (channel) {
        case "email":
          if (email) {
            // Mock email sending
            console.log(`Mock: Sending ${documents.length} documents to ${email}`);
            sendResults.email = true;
          } else {
            sendResults.email = false;
          }
          break;
          
        case "sms":
          if (phone) {
            // Mock SMS sending (typically with document links)
            console.log(`Mock: Sending SMS with document links to ${phone}`);
            sendResults.sms = true;
          } else {
            sendResults.sms = false;
          }
          break;
          
        case "whatsapp":
          if (phone) {
            // Mock WhatsApp sending
            console.log(`Mock: Sending WhatsApp message with documents to ${phone}`);
            sendResults.whatsapp = true;
          } else {
            sendResults.whatsapp = false;
          }
          break;
          
        default:
          console.log(`Unknown channel: ${channel}`);
      }
    }

    // Update documents with send tracking info
    const now = new Date().toISOString();
    const updatePromises = documentIds.map((docId: string) =>
      supabase
        .from("policy_documents")
        .update({
          last_sent_at: now,
          sent_via: channels,
          sent_to_email: email || null,
          sent_to_phone: phone || null,
        })
        .eq("id", docId)
    );

    await Promise.all(updatePromises);
    console.log("Updated document send tracking info");

    return new Response(
      JSON.stringify({
        success: true,
        message: `${documents.length} document(s) envoyé(s) via ${channels.join(", ")}`,
        sendResults,
        documentsSent: documents.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-policy-documents:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
