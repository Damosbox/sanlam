import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting survey send process...");

    // 1. Get pending surveys that need to be sent (scheduled_at <= now and status = 'pending')
    const now = new Date().toISOString();
    const { data: pendingSends, error: pendingError } = await supabase
      .from("survey_sends")
      .select(`
        *,
        survey_templates(name, description),
        survey_rules(channels)
      `)
      .eq("status", "pending")
      .lte("scheduled_at", now);

    if (pendingError) {
      console.error("Error fetching pending sends:", pendingError);
      throw pendingError;
    }

    console.log(`Found ${pendingSends?.length || 0} pending surveys to send`);

    // 2. Process each pending survey
    for (const send of pendingSends || []) {
      try {
        // Get recipient profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, display_name, phone")
          .eq("id", send.recipient_id)
          .single();

        if (!profile?.email) {
          console.log(`No email found for recipient ${send.recipient_id}, skipping`);
          continue;
        }

        // Build survey link
        const surveyLink = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/survey/${send.unique_token}`;

        // Log the send (in production, integrate with Resend or other email service)
        console.log(`Would send survey to ${profile.email}:`, {
          template: send.survey_templates?.name,
          link: surveyLink,
          channels: send.survey_rules?.channels,
        });

        // Calculate next reminder time
        const { data: rule } = await supabase
          .from("survey_rules")
          .select("reminder_delays, max_reminders")
          .eq("id", send.rule_id)
          .single();

        let nextReminderAt = null;
        if (rule && send.reminder_count < rule.max_reminders) {
          const delays = rule.reminder_delays || [24, 72];
          const nextDelay = delays[send.reminder_count];
          if (nextDelay) {
            const nextTime = new Date();
            nextTime.setHours(nextTime.getHours() + nextDelay);
            nextReminderAt = nextTime.toISOString();
          }
        }

        // Update send status
        await supabase
          .from("survey_sends")
          .update({
            status: "sent",
            sent_at: now,
            send_channel: "email",
            next_reminder_at: nextReminderAt,
          })
          .eq("id", send.id);

        console.log(`Survey ${send.id} marked as sent`);
      } catch (sendError) {
        console.error(`Error processing send ${send.id}:`, sendError);
      }
    }

    // 3. Process reminders for sent/opened surveys
    const { data: remindersNeeded, error: remindersError } = await supabase
      .from("survey_sends")
      .select(`
        *,
        survey_templates(name, description),
        survey_rules(reminder_delays, max_reminders, channels)
      `)
      .in("status", ["sent", "opened"])
      .lte("next_reminder_at", now);

    if (remindersError) {
      console.error("Error fetching reminders:", remindersError);
    } else {
      console.log(`Found ${remindersNeeded?.length || 0} reminders to send`);

      for (const send of remindersNeeded || []) {
        try {
          const rule = send.survey_rules;
          if (!rule || send.reminder_count >= rule.max_reminders) {
            // Mark as expired if max reminders reached
            await supabase
              .from("survey_sends")
              .update({ status: "expired", next_reminder_at: null })
              .eq("id", send.id);
            continue;
          }

          // Get recipient profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, display_name")
            .eq("id", send.recipient_id)
            .single();

          if (!profile?.email) continue;

          const surveyLink = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/survey/${send.unique_token}`;

          console.log(`Would send reminder #${send.reminder_count + 1} to ${profile.email}:`, {
            template: send.survey_templates?.name,
            link: surveyLink,
          });

          // Calculate next reminder
          const delays = rule.reminder_delays || [24, 72];
          const nextDelayIndex = send.reminder_count + 1;
          let nextReminderAt = null;

          if (nextDelayIndex < delays.length && nextDelayIndex < rule.max_reminders) {
            const nextTime = new Date();
            nextTime.setHours(nextTime.getHours() + delays[nextDelayIndex]);
            nextReminderAt = nextTime.toISOString();
          }

          await supabase
            .from("survey_sends")
            .update({
              reminder_count: send.reminder_count + 1,
              next_reminder_at: nextReminderAt,
            })
            .eq("id", send.id);

          console.log(`Reminder ${send.reminder_count + 1} processed for ${send.id}`);
        } catch (reminderError) {
          console.error(`Error processing reminder for ${send.id}:`, reminderError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingSends?.length || 0,
        reminders: remindersNeeded?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-survey function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
