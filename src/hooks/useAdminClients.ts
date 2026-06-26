import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminClientStatus = "active" | "user" | "no_account";

export interface AdminClientRow {
  id: string;
  source: "profile" | "lead";
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  status: AdminClientStatus;
  broker_id: string | null;
  broker_name: string | null;
  policies_count: number;
  claims_count: number;
  created_at: string;
  channel: "Portail Web" | "Mobile App" | "Agent" | "WhatsApp" | "Email";
  last_sign_in_at: string | null;
}

const CHANNELS: AdminClientRow["channel"][] = [
  "Portail Web",
  "Mobile App",
  "Agent",
  "WhatsApp",
  "Email",
];

// Deterministic mock helpers based on id hash
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const mockChannel = (id: string) => CHANNELS[hash(id) % CHANNELS.length];
const mockLastSignIn = (id: string, createdAt: string) => {
  const created = +new Date(createdAt);
  const daysAgo = (hash(id) % 60) + 1;
  const ts = Math.max(created, Date.now() - daysAgo * 86400000);
  return new Date(ts).toISOString();
};

export const useAdminClients = () => {
  return useQuery({
    queryKey: ["admin-clients-unified"],
    queryFn: async (): Promise<AdminClientRow[]> => {
      const [
        profilesRes,
        rolesRes,
        subsRes,
        claimsRes,
        brokerLinksRes,
        leadsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id, email, display_name, first_name, last_name, phone, created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("subscriptions").select("user_id, status"),
        supabase.from("claims").select("user_id"),
        supabase.from("broker_clients").select("client_id, broker_id"),
        supabase.from("leads").select("id, email, phone, first_name, last_name, status, assigned_broker_id, created_at"),
      ]);

      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];
      const subs = subsRes.data ?? [];
      const claims = claimsRes.data ?? [];
      const brokerLinks = brokerLinksRes.data ?? [];
      const leads = leadsRes.data ?? [];

      // broker name resolution from profiles
      const profileById = new Map<string, any>();
      profiles.forEach((p) => profileById.set(p.id, p));
      const brokerName = (id: string | null) => {
        if (!id) return null;
        const p = profileById.get(id);
        if (!p) return null;
        return p.display_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || null;
      };

      const rolesByUser = new Map<string, string[]>();
      roles.forEach((r) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });

      const subsByUser = new Map<string, number>();
      subs.forEach((s) => subsByUser.set(s.user_id, (subsByUser.get(s.user_id) ?? 0) + 1));

      const claimsByUser = new Map<string, number>();
      claims.forEach((c) => {
        if (!c.user_id) return;
        claimsByUser.set(c.user_id, (claimsByUser.get(c.user_id) ?? 0) + 1);
      });

      const brokerByClient = new Map<string, string>();
      brokerLinks.forEach((b) => brokerByClient.set(b.client_id, b.broker_id));

      // Profile rows (exclude broker / admin / staff accounts)
      const staffRoles = new Set(["broker", "admin", "backoffice_crc", "backoffice_conformite", "compliance"]);
      const profileRows: AdminClientRow[] = profiles
        .filter((p) => {
          const r = rolesByUser.get(p.id) ?? [];
          return !r.some((role) => staffRoles.has(role));
        })
        .map((p) => {
          const policies = subsByUser.get(p.id) ?? 0;
          const brokerId = brokerByClient.get(p.id) ?? null;
          return {
            id: p.id,
            source: "profile" as const,
            first_name: p.first_name,
            last_name: p.last_name,
            display_name: p.display_name,
            email: p.email,
            phone: p.phone,
            status: (policies > 0 ? "active" : "user") as AdminClientStatus,
            broker_id: brokerId,
            broker_name: brokerName(brokerId),
            policies_count: policies,
            claims_count: claimsByUser.get(p.id) ?? 0,
            created_at: p.created_at,
            channel: mockChannel(p.id),
            last_sign_in_at: mockLastSignIn(p.id, p.created_at),
          };
        });

      // Lead rows = converted leads with no matching profile email
      const profileEmails = new Set(
        profiles.map((p) => (p.email || "").toLowerCase()).filter(Boolean)
      );
      const leadRows: AdminClientRow[] = leads
        .filter((l) => l.status === "converti")
        .filter((l) => !l.email || !profileEmails.has(l.email.toLowerCase()))
        .map((l) => ({
          id: l.id,
          source: "lead" as const,
          first_name: l.first_name,
          last_name: l.last_name,
          display_name: [l.first_name, l.last_name].filter(Boolean).join(" ") || null,
          email: l.email,
          phone: l.phone,
          status: "no_account" as AdminClientStatus,
          broker_id: l.assigned_broker_id,
          broker_name: brokerName(l.assigned_broker_id),
          policies_count: 0,
          claims_count: 0,
          created_at: l.created_at,
          channel: "Agent" as const,
          last_sign_in_at: null,
        }));

      return [...profileRows, ...leadRows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
};