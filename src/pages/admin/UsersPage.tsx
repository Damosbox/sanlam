import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersTable } from "@/components/AdminUsersTable";
import { Users, Briefcase, UserCheck } from "lucide-react";

export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "clients";

  const handleChange = (value: string) => {
    setParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez l'ensemble des comptes de la plateforme : clients, agents et administrateurs.
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleChange} className="w-full">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto sm:inline-flex">
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="partners" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Administrateurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-6">
          <AdminUsersTable roleFilter="customer" />
        </TabsContent>
        <TabsContent value="partners" className="mt-6">
          <AdminUsersTable roleFilter="broker" />
        </TabsContent>
        <TabsContent value="admins" className="mt-6">
          <AdminUsersTable roleFilter="admin" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
