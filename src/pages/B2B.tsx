import { Header } from "@/components/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, MessageSquare, Shield, FormInput, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrokerClaimsTable } from "@/components/BrokerClaimsTable";
import { BrokerAnalytics } from "@/components/BrokerAnalytics";
import { BrokerClients } from "@/components/BrokerClients";
import { BrokerAIInsights } from "@/components/BrokerAIInsights";
import { BrokerSubscriptions } from "@/components/BrokerSubscriptions";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";
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

  // Fetch available form templates for B2B
  const { data: formTemplates } = useQuery({
    queryKey: ["form-templates-b2b"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_deployments")
        .select(
          `
          id,
          channel,
          form_template_id,
          form_templates (
            id,
            name,
            description,
            category,
            product_type
          )
        `,
        )
        .eq("channel", "B2B")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* 1. Welcome Banner (Réduction de hauteur et padding) */}
        <Card className="p-6 mb-4 gradient-activated text-white">
          {/* Baisse de la taille du titre (3xl -> 2xl) */}
          <h1 className="text-2xl font-bold mb-1">Espace Courtier 🤝</h1>
          {/* Réduction de la marge (mb-4) */}
          <p className="text-white/90 mb-0">Gérez vos clients et leurs sinistres avec des outils intelligents</p>
        </Card>

        {/* 7. Réduire l’espace entre Banner → Analytics (mb-8 -> mb-2/mb-4) */}
        {/* Analytics Overview (Priorité 1) */}
        <div className="mb-4">
          <BrokerAnalytics />
        </div>

        {/* 8. Main Management Tabs (Priorité 2) */}
        {/* Remplacement de mt-12 par mt-6 pour densifier */}
        <div className="mt-6">
          <Tabs defaultValue="leads" className="space-y-6">
            {/* 4. Améliorer la navigation Tabs (style CRM) */}
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto p-1 bg-muted/60 rounded-lg shadow-inner">
              {/* Styles des Triggers : py-2 pour réduire la hauteur, active state avec background blanc/shadow/border-radius */}
              <TabsTrigger
                value="leads"
                className="py-2 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-primary/10 transition-all duration-200 rounded-md"
              >
                <Inbox className="w-4 h-4" />
                Leads
              </TabsTrigger>
              <TabsTrigger
                value="claims"
                className="py-2 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-primary/10 transition-all duration-200 rounded-md"
              >
                <FileText className="w-4 h-4" />
                Sinistres
              </TabsTrigger>
              <TabsTrigger
                value="policies"
                className="py-2 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-primary/10 transition-all duration-200 rounded-md"
              >
                <Shield className="w-4 h-4" />
                Polices
              </TabsTrigger>
              <TabsTrigger
                value="clients"
                className="py-2 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-primary/10 transition-all duration-200 rounded-md"
              >
                <Users className="w-4 h-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger
                value="competitive"
                className="py-2 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-primary/10 transition-all duration-200 rounded-md"
              >
                <Shield className="w-4 h-4" />
                Analyse
              </TabsTrigger>
              <TabsTrigger
                value="communication"
                className="py-2 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-primary/10 transition-all duration-200 rounded-md"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
            </TabsList>

            {/* Contenu de l'onglet Leads */}
            <TabsContent value="leads" className="space-y-4">
              {/* 5 & 6. Enlever CardHeader et Mettre Lead Inbox dans un CardContent très compact */}
              <Card className="p-0">
                {" "}
                {/* Retrait du padding du Card (p-0) */}
                {/* Le CardHeader a été supprimé pour éviter la redondance du titre */}
                <CardContent>
                  {/* Le composant LeadInbox est supposé gérer en interne la réduction de la hauteur des lignes de table
                et l'activation d'un mode compact. Pour l'exemple, nous laissons le composant. */}
                  <LeadInbox isCompact={true} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contenu des autres onglets (Ajustement de l'espacement: mb-8 -> mb-4) */}
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

            <TabsContent value="competitive" className="space-y-4">
              <CompetitiveAnalyzer />
            </TabsContent>

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
        </div>

        {/* 3. Déplacer le bloc IA (BrokerAIInsights) plus bas (Priorité 3) */}
        {/* Ajout d'une marge supérieure pour le séparer des Tabs */}
        <div className="mt-8">
          <BrokerAIInsights />
        </div>
      </main>
    </div>
  );
};

export default B2B;
