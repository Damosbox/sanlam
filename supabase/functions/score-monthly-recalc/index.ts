// Edge Function — score-monthly-recalc
// Lance le recalcul VF_v2 pour tous les clients (role = customer).
// Déclenchable manuellement depuis l'admin (prototype, pas de cron).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, serviceKey);

  const started = Date.now();
  const { data: run } = await supabase
    .from("scoring_job_runs")
    .insert({ status: "running", trigger: "manual" })
    .select()
    .single();

  let processed = 0;
  const errors: { client_id: string; error: string }[] = [];

  try {
    const { data: clients } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "customer");

    for (const c of clients || []) {
      try {
        const res = await fetch(`${url}/functions/v1/score-client`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            client_id: c.user_id,
            trigger: "monthly_job",
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          errors.push({ client_id: c.user_id, error: txt });
        } else {
          processed += 1;
        }
      } catch (e) {
        errors.push({ client_id: c.user_id, error: String(e) });
      }
    }

    await supabase
      .from("scoring_job_runs")
      .update({
        status: errors.length ? "error" : "success",
        finished_at: new Date().toISOString(),
        clients_processed: processed,
        errors_count: errors.length,
        error_log: errors.slice(0, 50),
        duration_ms: Date.now() - started,
      })
      .eq("id", run!.id);

    return new Response(
      JSON.stringify({
        run_id: run!.id,
        processed,
        errors_count: errors.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    await supabase
      .from("scoring_job_runs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        clients_processed: processed,
        errors_count: errors.length + 1,
        error_log: [...errors, { client_id: "_global_", error: String(e) }],
        duration_ms: Date.now() - started,
      })
      .eq("id", run!.id);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});