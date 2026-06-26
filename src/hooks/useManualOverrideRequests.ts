import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ManualOverrideRequest {
  id: string;
  client_id: string;
  requested_by: string;
  requested_score: number;
  justification: string;
  status: "pending" | "approved" | "rejected";
  approver_id: string | null;
  approver_comment: string | null;
  current_score: number | null;
  current_niveau: string | null;
  created_at: string;
  decided_at: string | null;
}

export function useManualOverrideRequests(status?: "pending" | "all") {
  return useQuery({
    queryKey: ["manual-override-requests", status ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("scoring_manual_override_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (status === "pending") q = q.eq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ManualOverrideRequest[];
    },
  });
}

export function useCreateManualOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      clientId: string;
      requestedScore: number;
      justification: string;
      currentScore: number | null;
      currentNiveau: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");
      const { error } = await supabase
        .from("scoring_manual_override_requests")
        .insert({
          client_id: vars.clientId,
          requested_by: userData.user.id,
          requested_score: vars.requestedScore,
          justification: vars.justification,
          current_score: vars.currentScore,
          current_niveau: vars.currentNiveau,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-override-requests"] });
      toast.success("Demande envoyée pour validation");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur lors de l'envoi de la demande");
    },
  });
}

export function useDecideManualOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      requestId: string;
      decision: "approved" | "rejected";
      comment?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "score-manual-override-decide",
        {
          body: {
            request_id: vars.requestId,
            decision: vars.decision,
            comment: vars.comment,
          },
        },
      );
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).message ?? (data as any).error);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["manual-override-requests"] });
      qc.invalidateQueries({ queryKey: ["client-score-vf"] });
      toast.success(
        vars.decision === "approved" ? "Demande approuvée" : "Demande refusée",
      );
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur lors de la décision");
    },
  });
}

export interface ProfileBrief {
  id: string;
  display_name: string | null;
  email: string | null;
}

export function useProfilesBrief(userIds: string[]) {
  return useQuery({
    queryKey: ["profiles-brief", [...userIds].sort()],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", userIds);
      if (error) throw error;
      const map = new Map<string, ProfileBrief>();
      (data ?? []).forEach((p) => map.set(p.id, p as ProfileBrief));
      return map;
    },
  });
}