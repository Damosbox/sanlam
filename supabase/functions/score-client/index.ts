// Edge Function — score-client (VF_v2)
// Calcule et persiste le score d'un client à partir des données internes
// (subscriptions, claims). Supporte l'ajout d'une action ponctuelle avec
// plafond 15 pts / 12 mois glissants.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Niveau = "bronze" | "argent" | "or" | "platine";

const ACTION_POINTS: Record<string, number> = {
  parrainage: 5,
  renouvellement: 3,
  diversification: 3,
  souscription: 2,
  enquete: 2,
};

const CAP_PER_YEAR = 15;
const SCORE_MIN = -5;
const SCORE_MAX = 100;

function getNiveau(score: number): Niveau {
  if (score >= 80) return "platine";
  if (score >= 65) return "or";
  if (score >= 40) return "argent";
  return "bronze";
}

function scoreAnciennete(y: number | null) {
  if (y == null) return 0;
  if (y >= 10) return 20;
  if (y >= 5) return 15;
  if (y >= 3) return 10;
  return 5;
}
function scorePrime(a: number | null) {
  if (a == null) return 0;
  if (a >= 1_000_000) return 30;
  if (a >= 500_000) return 20;
  if (a >= 50_000) return 10;
  return 5;
}
function scoreMulti(n: number | null) {
  if (n == null) return 0;
  if (n >= 5) return 20;
  if (n === 4) return 15;
  if (n === 3) return 10;
  if (n === 2) return 5;
  return 0;
}
function scoreSinistre(n: number | null) {
  if (n == null) return 0;
  if (n === 0) return 15;
  if (n === 1) return 0;
  return -5;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, serviceKey);

    const body = await req.json().catch(() => ({}));
    const clientId: string | undefined = body.client_id;
    const trigger: string = body.trigger || "manual";
    const action: { type?: string; note?: string } | undefined = body.action;

    if (!clientId) {
      return new Response(JSON.stringify({ error: "client_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Action ponctuelle : vérifier le plafond avant de l'enregistrer ---
    if (action?.type) {
      const points = ACTION_POINTS[action.type];
      if (!points) {
        return new Response(JSON.stringify({ error: "invalid action type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
      const { data: priorActions } = await supabase
        .from("scoring_actions_ponctuelles")
        .select("points")
        .eq("client_id", clientId)
        .gte("created_at", oneYearAgo);
      const cumulated = (priorActions || []).reduce(
        (s, a) => s + (a.points || 0),
        0,
      );
      if (cumulated + points > CAP_PER_YEAR) {
        return new Response(
          JSON.stringify({
            error: "cap_exceeded",
            message: `Plafond annuel atteint (${CAP_PER_YEAR} pts/an). Cumul actuel : ${cumulated}.`,
          }),
          {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      await supabase.from("scoring_actions_ponctuelles").insert({
        client_id: clientId,
        type: action.type,
        points,
        note: action.note ?? null,
      });
    }

    // --- Lire les données du client ---
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, created_at")
      .eq("id", clientId)
      .maybeSingle();

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("id, monthly_premium, start_date, product_id")
      .eq("user_id", clientId);

    const { data: claims } = await supabase
      .from("claims")
      .select("id, status, created_at, is_responsible")
      .eq("user_id", clientId);

    // --- Construire les inputs ---
    const subs = subscriptions || [];
    const cl = claims || [];

    const prime_annuelle = subs.length
      ? subs.reduce((s, x: any) => s + (Number(x.monthly_premium) || 0) * 12, 0)
      : profile
      ? null
      : null;

    const productIds = new Set(subs.map((s: any) => s.product_id).filter(Boolean));
    const nb_equipements = subs.length ? productIds.size : null;

    let anciennete_annees: number | null = null;
    if (subs.length) {
      const oldest = Math.min(
        ...subs.map((s: any) => new Date(s.start_date).getTime()),
      );
      anciennete_annees =
        (Date.now() - oldest) / (1000 * 60 * 60 * 24 * 365);
    } else if (profile?.created_at) {
      anciennete_annees =
        (Date.now() - new Date(profile.created_at).getTime()) /
        (1000 * 60 * 60 * 24 * 365);
    }

    // sinistres responsables sur les 12 derniers mois
    const oneYearAgo = Date.now() - 365 * 24 * 3600 * 1000;
    const sinistres_responsables_annee = cl.length
      ? cl.filter(
          (c: any) =>
            c.is_responsible === true &&
            new Date(c.created_at).getTime() >= oneYearAgo,
        ).length
      : null;

    // Cumul des actions ponctuelles 12 mois
    const oneYearAgoIso = new Date(oneYearAgo).toISOString();
    const { data: actions } = await supabase
      .from("scoring_actions_ponctuelles")
      .select("points")
      .eq("client_id", clientId)
      .gte("created_at", oneYearAgoIso);
    const action_ponctuelle_points = Math.min(
      CAP_PER_YEAR,
      (actions || []).reduce((s, a: any) => s + (a.points || 0), 0),
    );

    // --- Calcul ---
    const missing: string[] = [];
    if (anciennete_annees == null) missing.push("anciennete_annees");
    if (prime_annuelle == null) missing.push("prime_annuelle");
    if (nb_equipements == null) missing.push("nb_equipements");

    const sa = scoreAnciennete(anciennete_annees);
    const sp = scorePrime(prime_annuelle);
    const sm = scoreMulti(nb_equipements);
    const ss = scoreSinistre(sinistres_responsables_annee);
    const sap = action_ponctuelle_points;

    const total = Math.max(
      SCORE_MIN,
      Math.min(SCORE_MAX, sa + sp + sm + ss + sap),
    );
    const niveau = getNiveau(total);

    // --- Lire ancien score (idempotence + history) ---
    const { data: existing } = await supabase
      .from("client_scores")
      .select("id, vf_score_global, vf_niveau")
      .eq("client_id", clientId)
      .eq("product_type", "all")
      .maybeSingle();

    const payload = {
      client_id: clientId,
      product_type: "all",
      vf_score_anciennete: sa,
      vf_score_prime: sp,
      vf_score_multi_equipements: sm,
      vf_score_sinistre: ss,
      vf_score_action_ponctuelle: sap,
      vf_score_global: total,
      vf_niveau: niveau,
      vf_is_partial: missing.length > 0,
      vf_missing_fields: missing,
      vf_last_recalc_source: trigger,
      score_global: total,
      classe: Math.max(1, Math.min(5, Math.ceil(((total + 5) / 105) * 5))),
      calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from("client_scores")
        .update(payload)
        .eq("id", existing.id);
    } else {
      await supabase.from("client_scores").insert(payload);
    }

    await supabase.from("scoring_history").insert({
      client_id: clientId,
      score_before: existing?.vf_score_global ?? null,
      score_after: total,
      niveau_before: existing?.vf_niveau ?? null,
      niveau_after: niveau,
      trigger,
    });

    return new Response(
      JSON.stringify({
        score_global: total,
        niveau,
        is_partial: missing.length > 0,
        missing_fields: missing,
        breakdown: {
          score_anciennete: sa,
          score_prime: sp,
          score_multi_equipements: sm,
          score_sinistre: ss,
          score_action_ponctuelle: sap,
        },
        level_changed: existing?.vf_niveau && existing.vf_niveau !== niveau,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("score-client error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});