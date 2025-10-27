import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Gift, TrendingUp, Zap } from "lucide-react";
import { AdminLoyaltyStats } from "./AdminLoyaltyStats";
import { AdminLoyaltyMissions } from "./AdminLoyaltyMissions";
import { AdminLoyaltyRewards } from "./AdminLoyaltyRewards";
import { AdminLoyaltyUsers } from "./AdminLoyaltyUsers";

export const AdminLoyalty = () => {
  const [activeTab, setActiveTab] = useState("stats");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            Gestion Programme Fidélité
          </h2>
          <p className="text-muted-foreground">
            Pilotez et optimisez votre programme de fidélisation
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="missions" className="gap-2">
            <Zap className="w-4 h-4" />
            Missions
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Gift className="w-4 h-4" />
            Récompenses
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Utilisateurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <AdminLoyaltyStats />
        </TabsContent>

        <TabsContent value="missions" className="mt-6">
          <AdminLoyaltyMissions />
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <AdminLoyaltyRewards />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AdminLoyaltyUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
};