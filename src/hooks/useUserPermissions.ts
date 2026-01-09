import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "broker" | "customer" | null;

export interface UseUserPermissionsResult {
  role: UserRole;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const useUserPermissions = (user: User | null): UseUserPermissionsResult => {
  const [role, setRole] = useState<UserRole>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleAndPermissions = async () => {
      if (!user) {
        setRole(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch user role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .order("role", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (roleError) {
          console.error("Error fetching user role:", roleError);
          setRole(null);
          setPermissions([]);
          setLoading(false);
          return;
        }

        const userRole = (roleData?.role as UserRole) ?? "customer";
        setRole(userRole);

        // Fetch permissions for this role
        const { data: permData, error: permError } = await supabase
          .from("role_permissions")
          .select(`
            permissions:permission_id (
              name
            )
          `)
          .eq("role", userRole);

        if (permError) {
          console.error("Error fetching permissions:", permError);
          setPermissions([]);
        } else {
          const permNames = permData
            ?.map((rp: any) => rp.permissions?.name)
            .filter(Boolean) as string[];
          setPermissions(permNames || []);
        }
      } catch (error) {
        console.error("Error fetching role and permissions:", error);
        setRole(null);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleAndPermissions();
  }, [user]);

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: string[]) => perms.some((p) => permissions.includes(p)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: string[]) => perms.every((p) => permissions.includes(p)),
    [permissions]
  );

  return {
    role,
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
