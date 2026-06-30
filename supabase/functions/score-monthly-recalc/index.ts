// Edge Function — score-monthly-recalc
// Lance le recalcul VF_v2 des clients (role = customer).
// Déclenchable manuellement ou via pg_cron (daily / weekly / monthly).
// Body : { trigger?: string, scope?: 'full' | 'delta', stale_days?: number }
//   - scope = 'delta' (défaut quotidien) : uniquement les clients non scorés
//     ou dont le score date de plus de stale_days jours.
//   - scope = 'full' (défaut hebdo/mensuel) : tous les clients customer.

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

  let body: { trigger?: string; scope?: "full" | "delta"; stale_days?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const trigger = body.trigger ?? "manual";
  const scope = body.scope ?? (trigger === "cron_daily" ? "delta" : "full");
  const staleDays = body.stale_days ?? 30;

  const started = Date.now();
  const { data: run } = await supabase
    .from("scoring_job_runs")
    .insert({ status: "running", trigger })
    .select()
    .single();

  let processed = 0;
  const errors: { client_id: string; error: string }[] = [];

  try {
    const { data: allClients } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "customer");
    const clientIds = (allClients ?? []).map((c: any) => c.user_id as string);

    // Determine which clients to process
    let toProcess = clientIds;
    if (scope === "delta") {
      const staleBefore = new Date(
        Date.now() - staleDays * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data: fresh } = await supabase
        .from("client_scores")
        .select("client_id, calculated_at")
        .eq("product_type", "all")
        .gte("calculated_at", staleBefore);
      const freshSet = new Set((fresh ?? []).map((r: any) => r.client_id));
      toProcess = clientIds.filter((id) => !freshSet.has(id));
    }

    for (const clientId of toProcess) {
      try {
        const res = await fetch(`${url}/functions/v1/score-client`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            client_id: clientId,
            trigger,
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          errors.push({ client_id: clientId, error: txt });
        } else {
          processed += 1;
        }
      } catch (e) {
        errors.push({ client_id: clientId, error: String(e) });
      }
    }

    // Coverage : combien de clients ont (encore) un score, combien manquent
    const { data: scored } = await supabase
      .from("client_scores")
      .select("client_id")
      .eq("product_type", "all")
      .in("client_id", clientIds.length ? clientIds : ["00000000-0000-0000-0000-000000000000"]);
    const scoredCount = (scored ?? []).length;
    const total = clientIds.length;
    const unscored = Math.max(0, total - scoredCount);

    await supabase
      .from("scoring_job_runs")
      .update({
        status: errors.length ? "error" : "success",
        finished_at: new Date().toISOString(),
        clients_processed: processed,
        errors_count: errors.length,
        error_log: errors.slice(0, 50),
        duration_ms: Date.now() - started,
        clients_total: total,
        clients_unscored: unscored,
      })
      .eq("id", run!.id);

    return new Response(
      JSON.stringify({
        run_id: run!.id,
        processed,
        errors_count: errors.length,
        clients_total: total,
        clients_unscored: unscored,
        scope,
        trigger,
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