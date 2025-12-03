import { Header } from "@/components/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, MessageSquare, Shield, Inbox } from "lucide-react";
import { BrokerClaimsTable } from "@/components/BrokerClaimsTable";
import { BrokerAnalytics } from "@/components/BrokerAnalytics";
import { BrokerClients } from "@/components/BrokerClients";
import { BrokerAIInsights } from "@/components/BrokerAIInsights";
import { BrokerSubscriptions } from "@/components/BrokerSubscriptions";
import { CompetitiveAnalyzer } from "@/components/CompetitiveAnalyzer";
import { LeadInbox } from "@/components/LeadInbox";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

const B2B = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedFormTemplate, setSelectedFormTemplate] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Compact Welcome Banner */}
        <Card className="p-6 mb-6 gradient-activated text-white">
          <h1 className="text-2xl font-bold mb-1">Espace Courtier 🤝</h1>
          <p className="text-white/80">Gérez vos clients et leurs sinistres</p>
        </Card>

        {/* Analytics Overview - Compact */}
        <div className="mb-4">
          <BrokerAnalytics />
        </div>

        {/* Main Management Tabs - Optimized */}
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full bg-muted/40 rounded-lg p-1">
            <TabsTrigger
              value="leads"
              className="flex items-center justify-center gap-2 py-2 
              data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:rounded-md"
            >
              <Inbox className="w-4 h-4" /> Leads
            </TabsTrigger>

            <TabsTrigger
              value="claims"
              className="flex items-center justify-center gap-2 py-2 
              data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:rounded-md"
            >
              <FileText className="w-4 h-4" /> Sinistres
            </TabsTrigger>

            <TabsTrigger
              value="policies"
              className="flex items-center justify-center gap-2 py-2 
              data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:rounded-md"
            >
              <Shield className="w-4 h-4" /> Polices
            </TabsTrigger>

            <TabsTrigger
              value="clients"
              className="flex items-center justify-center gap-2 py-2 
              data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:rounded-md"
            >
              <Users className="w-4 h-4" /> Clients
            </TabsTrigger>

            <TabsTrigger
              value="competitive"
              className="flex items-center justify-center gap-2 py-2 
              data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:rounded-md"
            >
              <Shield className="w-4 h-4" /> Analyse
            </TabsTrigger>

            <TabsTrigger
              value="communication"
              className="flex items-center justify-center gap-2 py-2 
              data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:rounded-md"
            >
              <MessageSquare className="w-4 h-4" /> Messages
            </TabsTrigger>
          </TabsList>

          {/* SECTION LEADS */}
          <TabsContent value="leads" className="space-y-4">
            <h2 className="text-xl font-semibold">Lead Inbox</h2>

            <Card className="mt-2">
              <CardContent className="p-0">
                <LeadInbox />
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION CLAIMS */}
          <TabsContent value="claims" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sinistres à examiner</CardTitle>
              </CardHeader>
              <CardContent>
                <BrokerClaimsTable />
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION POLICIES */}
          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Polices assignées</CardTitle>
              </CardHeader>
              <CardContent>
                <BrokerSubscriptions />
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION CLIENTS */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <BrokerClients />
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION COMPÉTITIVE */}
          <TabsContent value="competitive" className="space-y-4">
            <CompetitiveAnalyzer />
          </TabsContent>

          {/* SECTION MESSAGES */}
          <TabsContent value="communication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Centre de Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">Messagerie - En cours de développement</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Insights moved below (not above tabs) */}
        <div className="mt-8">
          <BrokerAIInsights />
        </div>
      </main>
    </div>
  );
};

export default B2B;
