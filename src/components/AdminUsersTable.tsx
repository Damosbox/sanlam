import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, User, Briefcase, Phone } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  user_roles: Array<{
    role: "admin" | "broker" | "customer";
  }>;
  broker_settings?: {
    otp_verification_enabled: boolean;
  } | null;
}

export const AdminUsersTable = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch roles and broker settings separately
      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);

          const { data: settings } = await supabase
            .from("broker_settings")
            .select("otp_verification_enabled")
            .eq("broker_id", user.id)
            .maybeSingle();

          return {
            ...user,
            user_roles: roles || [],
            broker_settings: settings,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole as "admin" | "broker" | "customer" }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Rôle utilisateur mis à jour",
      });
      
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle",
        variant: "destructive",
      });
    }
  };

  const toggleOTPVerification = async (userId: string, currentEnabled: boolean) => {
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from("broker_settings")
        .select("id")
        .eq("broker_id", userId)
        .maybeSingle();

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from("broker_settings")
          .update({ otp_verification_enabled: !currentEnabled })
          .eq("broker_id", userId);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from("broker_settings")
          .insert({ broker_id: userId, otp_verification_enabled: !currentEnabled });

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: `Vérification OTP ${!currentEnabled ? "activée" : "désactivée"}`,
      });
      
      fetchUsers();
    } catch (error) {
      console.error("Error toggling OTP:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier les paramètres OTP",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "broker":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      broker: "secondary",
      customer: "outline",
    };

    return (
      <Badge variant={variants[role] || "outline"} className="flex items-center gap-1 w-fit">
        {getRoleIcon(role)}
        <span className="capitalize">{role}</span>
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle actuel</TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                OTP Téléphone
              </div>
            </TableHead>
            <TableHead>Date création</TableHead>
            <TableHead className="text-right">Modifier rôle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const currentRole = user.user_roles[0]?.role || "customer";
            const isBrokerOrAdmin = currentRole === "broker" || currentRole === "admin";
            const otpEnabled = user.broker_settings?.otp_verification_enabled || false;
            
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.display_name || "N/A"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email || "N/A"}
                </TableCell>
                <TableCell>{getRoleBadge(currentRole)}</TableCell>
                <TableCell>
                  {isBrokerOrAdmin ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={otpEnabled}
                        onCheckedChange={() => toggleOTPVerification(user.id, otpEnabled)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {otpEnabled ? "Activé" : "Désactivé"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Select
                    value={currentRole}
                    onValueChange={(value) => updateUserRole(user.id, value)}
                  >
                    <SelectTrigger className="w-[140px] ml-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="broker">Broker</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};