import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriggerEvent {
  event_type: string;
  source_type: string;
  source_id: string;
  user_id: string;
  user_type: "client" | "broker";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { event_type, source_type, source_id, user_id, user_type } = body as TriggerEvent;

    console.log("Processing survey trigger:", { event_type, source_type, source_id, user_id, user_type });

    // Find matching survey templates for this event
    const { data: templates, error: templatesError } = await supabase
      .from("survey_templates")
      .select(`
        id,
        target_audience,
        survey_rules(
          id,
          trigger_delay_hours,
          is_active
        )
      `)
      .eq("trigger_event", event_type)
      .eq("is_active", true);

    if (templatesError) {
      console.error("Error fetching templates:", templatesError);
      throw templatesError;
    }

    console.log(`Found ${templates?.length || 0} matching templates for event ${event_type}`);

    const surveysCreated: string[] = [];

    for (const template of templates || []) {
      // Check if audience matches
      if (
        template.target_audience !== "both" &&
        template.target_audience !== user_type
      ) {
        console.log(`Template ${template.id} audience (${template.target_audience}) doesn't match user type (${user_type}), skipping`);
        continue;
      }

      // Get active rules for this template
      const activeRules = template.survey_rules?.filter((r: any) => r.is_active) || [];

      for (const rule of activeRules) {
        // Check if we already have a pending/sent survey for this source
        const { data: existingSend } = await supabase
          .from("survey_sends")
          .select("id")
          .eq("survey_template_id", template.id)
          .eq("recipient_id", user_id)
          .eq("trigger_source_id", source_id)
          .in("status", ["pending", "sent", "opened"])
          .single();

        if (existingSend) {
          console.log(`Survey already exists for template ${template.id} and source ${source_id}, skipping`);
          continue;
        }

        // Calculate scheduled time
        const scheduledAt = new Date();
        scheduledAt.setHours(scheduledAt.getHours() + (rule.trigger_delay_hours || 1));

        // Create survey send
        const { data: newSend, error: sendError } = await supabase
          .from("survey_sends")
          .insert({
            survey_template_id: template.id,
            rule_id: rule.id,
            recipient_id: user_id,
            recipient_type: user_type,
            trigger_source_type: source_type,
            trigger_source_id: source_id,
            status: "pending",
            scheduled_at: scheduledAt.toISOString(),
          })
          .select("id")
          .single();

        if (sendError) {
          console.error("Error creating survey send:", sendError);
          continue;
        }

        console.log(`Created survey send ${newSend.id} scheduled for ${scheduledAt.toISOString()}`);
        surveysCreated.push(newSend.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        surveys_created: surveysCreated.length,
        survey_ids: surveysCreated,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in process-survey-triggers:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
