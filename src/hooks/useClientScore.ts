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

export function useClientScore(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-score-vf", clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<ClientVfScore | null> => {
      const { data, error } = await supabase
        .from("client_scores")
        .select(
          "vf_score_global, vf_niveau, vf_score_anciennete, vf_score_prime, vf_score_multi_equipements, vf_score_sinistre, vf_score_action_ponctuelle, vf_is_partial, vf_missing_fields, vf_manual_override, vf_kyc_flag, vf_last_recalc_source, calculated_at",
        )
        .eq("client_id", clientId!)
        .eq("product_type", "all")
        .maybeSingle();
      if (error) throw error;
      return (data as any) ?? null;
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