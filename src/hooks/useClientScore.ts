import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientVfScore {
  vf_score_global: number | null;
  vf_niveau: "bronze" | "argent" | "or" | "platine" | null;
  vf_score_anciennete: number | null;
  vf_score_prime: number | null;
  vf_score_multi_equipements: number | null;
  vf_score_sinistre: number | null;
  vf_score_action_ponctuelle: number | null;
  vf_is_partial: boolean | null;
  vf_missing_fields: string[] | null;
  vf_manual_override: boolean | null;
  vf_kyc_flag: boolean | null;
  vf_last_recalc_source: string | null;
  calculated_at: string | null;
}

// ⚠️ PROTOTYPE — score de fidélité 100 % mocké (déterministe par clientId).
// Aucune lecture/écriture en base : on génère un score stable à partir d'un
// hash du clientId pour qu'un même client garde toujours la même médaille.
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function mockScoreFor(clientId: string): ClientVfScore {
  const h = hashString(clientId);
  // Distribution des paliers pour le prototype : bronze / argent / or / platine
  const buckets: Array<{ niveau: ClientVfScore["vf_niveau"]; min: number; max: number }> = [
    { niveau: "bronze", min: 15, max: 38 },
    { niveau: "argent", min: 45, max: 62 },
    { niveau: "or", min: 68, max: 78 },
    { niveau: "platine", min: 82, max: 95 },
  ];
  const bucket = buckets[h % buckets.length];
  const span = bucket.max - bucket.min + 1;
  const score = bucket.min + (Math.floor(h / 7) % span);

  // Sous-scores cohérents (somme ≈ score) — purement décoratifs.
  const sa = Math.min(20, Math.max(5, Math.round(score * 0.2)));
  const sp = Math.min(30, Math.max(5, Math.round(score * 0.3)));
  const sm = Math.min(20, Math.max(0, Math.round(score * 0.2)));
  const ss = score >= 60 ? 15 : score >= 40 ? 5 : 0;
  const sap = Math.max(0, score - (sa + sp + sm + ss));

  return {
    vf_score_global: score,
    vf_niveau: bucket.niveau,
    vf_score_anciennete: sa,
    vf_score_prime: sp,
    vf_score_multi_equipements: sm,
    vf_score_sinistre: ss,
    vf_score_action_ponctuelle: Math.min(15, sap),
    vf_is_partial: false,
    vf_missing_fields: [],
    vf_manual_override: false,
    vf_kyc_flag: false,
    vf_last_recalc_source: "mock",
    calculated_at: new Date().toISOString(),
  };
}

export function useClientScore(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-score-vf-mock", clientId],
    enabled: !!clientId,
    staleTime: Infinity,
    queryFn: async (): Promise<ClientVfScore | null> => {
      if (!clientId) return null;
      return mockScoreFor(clientId);
    },
  });
}

export function useRecalcClientScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      clientId: string;
      trigger?: string;
      action?: { type: string; note?: string };
    }) => {
      const { data, error } = await supabase.functions.invoke("score-client", {
        body: {
          client_id: vars.clientId,
          trigger: vars.trigger ?? "manual",
          action: vars.action,
        },
      });
      if (error) throw error;
      if ((data as any)?.error === "cap_exceeded") {
        throw new Error((data as any).message);
      }
      return data as {
        score_global: number;
        niveau: "bronze" | "argent" | "or" | "platine";
        is_partial: boolean;
        missing_fields: string[];
        level_changed?: boolean;
      };
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["client-score-vf", vars.clientId] });
      qc.invalidateQueries({ queryKey: ["scoring-actions", vars.clientId] });
      qc.invalidateQueries({ queryKey: ["scoring-history", vars.clientId] });
      if (data.level_changed) {
        toast.success(`Nouveau niveau atteint : ${data.niveau}`);
      }
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur lors du recalcul du score");
    },
  });
}

export function useScoringActions(clientId: string | undefined) {
  return useQuery({
    queryKey: ["scoring-actions", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_actions_ponctuelles")
        .select("id, type, points, note, created_at")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useScoringHistory(clientId: string | undefined) {
  return useQuery({
    queryKey: ["scoring-history", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_history")
        .select("id, score_before, score_after, niveau_before, niveau_after, trigger, created_at")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}