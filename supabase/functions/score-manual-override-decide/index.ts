// Edge Function — score-manual-override-decide
// Approuve ou refuse une demande de modification manuelle de score.
// Sécurité : seul un admin peut décider ; impossible de s'auto-approuver.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getNiveau(score: number): string {
  if (score >= 80) return "platine";
  if (score >= 65) return "or";
  if (score >= 40) return "argent";
  return "bronze";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // Vérifie rôle admin
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "forbidden", message: "Réservé aux administrateurs" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const { request_id, decision, comment } = body ?? {};
    if (
      !request_id ||
      (decision !== "approved" && decision !== "rejected")
    ) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Paramètres invalides" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (decision === "rejected" && (!comment || String(comment).trim().length < 5)) {
      return new Response(
        JSON.stringify({
          error: "bad_request",
          message: "Un commentaire est requis pour refuser une demande",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Charge la demande
    const { data: reqRow, error: reqErr } = await admin
      .from("scoring_manual_override_requests")
      .select("*")
      .eq("id", request_id)
      .maybeSingle();
    if (reqErr || !reqRow) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (reqRow.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "conflict", message: "Demande déjà traitée" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (reqRow.requested_by === userId) {
      return new Response(
        JSON.stringify({
          error: "forbidden",
          message: "Vous ne pouvez pas approuver votre propre demande",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const now = new Date().toISOString();

    if (decision === "approved") {
      const newScore = Math.max(-5, Math.min(100, Number(reqRow.requested_score)));
      const newNiveau = getNiveau(newScore);

      // Snapshot actuel
      const { data: currentScore } = await admin
        .from("client_scores")
        .select("vf_score_global, vf_niveau")
        .eq("client_id", reqRow.client_id)
        .eq("product_type", "all")
        .maybeSingle();

      const scoreBefore = currentScore?.vf_score_global ?? reqRow.current_score ?? null;
      const niveauBefore = currentScore?.vf_niveau ?? reqRow.current_niveau ?? null;

      // Upsert client_scores
      const { error: upsertErr } = await admin
        .from("client_scores")
        .upsert(
          {
            client_id: reqRow.client_id,
            product_type: "all",
            vf_score_global: newScore,
            vf_niveau: newNiveau,
            vf_manual_override: true,
            vf_override_reason: reqRow.justification,
            vf_override_approved_by: userId,
            vf_last_recalc_source: "manual_override",
            calculated_at: now,
            updated_at: now,
          },
          { onConflict: "client_id,product_type" },
        );
      if (upsertErr) throw upsertErr;

      // Historique
      await admin.from("scoring_history").insert({
        client_id: reqRow.client_id,
        score_before: scoreBefore,
        score_after: newScore,
        niveau_before: niveauBefore,
        niveau_after: newNiveau,
        trigger: "manual_override",
      });
    }

    // Met à jour la demande
    const { error: updErr } = await admin
      .from("scoring_manual_override_requests")
      .update({
        status: decision,
        approver_id: userId,
        approver_comment: comment ?? null,
        decided_at: now,
      })
      .eq("id", request_id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ ok: true, decision }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-manual-override-decide error", e);
    return new Response(
      JSON.stringify({ error: "internal", message: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});