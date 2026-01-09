import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Users, FileText, Target, ClipboardList, BarChart3, Settings } from "lucide-react";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  role: string;
  permission_id: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  broker: "Courtier",
  customer: "Client",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500",
  broker: "bg-blue-500",
  customer: "bg-green-500",
};

const CATEGORY_ICONS: Record<string, any> = {
  "Utilisateurs": Users,
  "Clients": Users,
  "Leads": Target,
  "Polices": FileText,
  "Sinistres": ClipboardList,
  "Enquêtes": ClipboardList,
  "Analytics": BarChart3,
  "Paramètres": Settings,
};

export const AdminPermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const roles: Array<"admin" | "broker" | "customer"> = ["admin", "broker", "customer"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [permRes, rpRes] = await Promise.all([
        supabase.from("permissions").select("*").order("category").order("name"),
        supabase.from("role_permissions").select("*"),
      ]);

      if (permRes.error) throw permRes.error;
      if (rpRes.error) throw rpRes.error;

      setPermissions(permRes.data || []);
      setRolePermissions(rpRes.data || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Erreur lors du chargement des permissions");
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: string, permissionId: string) => {
    return rolePermissions.some(
      (rp) => rp.role === role && rp.permission_id === permissionId
    );
  };

  const togglePermission = async (role: "admin" | "broker" | "customer", permissionId: string) => {
    const key = `${role}-${permissionId}`;
    setUpdating(key);

    try {
      const exists = hasPermission(role, permissionId);

      if (exists) {
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role", role)
          .eq("permission_id", permissionId);

        if (error) throw error;

        setRolePermissions((prev) =>
          prev.filter(
            (rp) => !(rp.role === role && rp.permission_id === permissionId)
          )
        );
        toast.success("Permission retirée");
      } else {
        const { data, error } = await supabase
          .from("role_permissions")
          .insert({ role: role, permission_id: permissionId })
          .select()
          .single();

        if (error) throw error;

        setRolePermissions((prev) => [...prev, data]);
        toast.success("Permission ajoutée");
      }
    } catch (error) {
      console.error("Error toggling permission:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Matrice des Permissions</CardTitle>
          </div>
          <CardDescription>
            Gérez les permissions accordées à chaque rôle. Cochez ou décochez pour modifier les accès.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Role headers */}
          <div className="mb-4 flex justify-end gap-4 pr-2">
            {roles.map((role) => (
              <div key={role} className="w-24 text-center">
                <Badge className={`${ROLE_COLORS[role]} text-white`}>
                  {ROLE_LABELS[role]}
                </Badge>
              </div>
            ))}
          </div>

          {/* Permission categories */}
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => {
              const Icon = CATEGORY_ICONS[category] || Shield;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{category}</h3>
                  </div>
                  <div className="space-y-1">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{perm.description}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {perm.name}
                          </p>
                        </div>
                        <div className="flex gap-4">
                          {roles.map((role) => {
                            const key = `${role}-${perm.id}`;
                            const isUpdating = updating === key;
                            const checked = hasPermission(role, perm.id);

                            return (
                              <div key={role} className="w-24 flex justify-center">
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() =>
                                      togglePermission(role, perm.id)
                                    }
                                    disabled={role === "admin"} // Admin always has all
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
