import { Header } from "@/components/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, MessageSquare, Shield, FormInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrokerClaimsTable } from "@/components/BrokerClaimsTable";
import { BrokerAnalytics } from "@/components/BrokerAnalytics";
import { BrokerClients } from "@/components/BrokerClients";
import { BrokerAIInsights } from "@/components/BrokerAIInsights";
import { BrokerSubscriptions } from "@/components/BrokerSubscriptions";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch available form templates for B2B
  const { data: formTemplates } = useQuery({
    queryKey: ['form-templates-b2b'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_deployments')
        .select(`
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
        `)
        .eq('channel', 'B2B')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        {/* Welcome Banner */}
        <Card className="p-8 mb-8 gradient-activated text-white">
          <h1 className="text-3xl font-bold mb-2">Espace Courtier 🤝</h1>
          <p className="text-white/90 mb-4">Gérez vos clients et leurs sinistres avec des outils intelligents</p>
        </Card>

        {/* Analytics Overview */}
        <BrokerAnalytics />

        {/* AI Insights */}
        <div className="mt-8">
          <BrokerAIInsights />
        </div>

        {/* Main Management Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="claims" className="space-y-6">
            <TabsList className="grid w-full max-w-[1000px] grid-cols-5">
              <TabsTrigger value="claims" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Sinistres
              </TabsTrigger>
              <TabsTrigger value="policies" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Polices
              </TabsTrigger>
              <TabsTrigger value="forms" className="flex items-center gap-2">
                <FormInput className="w-4 h-4" />
                Formulaires
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
            </TabsList>

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

            <TabsContent value="forms" className="space-y-4">
              {selectedFormTemplate ? (
                <DynamicFormRenderer
                  templateId={selectedFormTemplate}
                  user={user}
                  channel="B2B"
                  onCancel={() => setSelectedFormTemplate(null)}
                  onSubmit={(data) => {
                    console.log('Form submitted:', data);
                    setSelectedFormTemplate(null);
                  }}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Formulaires de souscription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formTemplates && formTemplates.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formTemplates.map((deployment: any) => (
                          <Card
                            key={deployment.id}
                            className="p-6 hover:shadow-medium transition-base cursor-pointer border-2"
                            onClick={() => setSelectedFormTemplate(deployment.form_template_id)}
                          >
                            <div className="space-y-3">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FormInput className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {deployment.form_templates.name}
                                </h3>
                                {deployment.form_templates.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {deployment.form_templates.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                                  {deployment.form_templates.category}
                                </span>
                                <span className="text-muted-foreground">
                                  {deployment.form_templates.product_type}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FormInput className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Aucun formulaire disponible pour le moment
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
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

            <TabsContent value="communication" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Centre de Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Messagerie - En cours de développement
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default B2B;
