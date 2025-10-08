import { Header } from "@/components/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, TrendingUp, MessageSquare, Brain } from "lucide-react";
import { BrokerClaimsTable } from "@/components/BrokerClaimsTable";
import { BrokerAnalytics } from "@/components/BrokerAnalytics";
import { Button } from "@/components/ui/button";

const B2B = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        {/* Welcome Banner */}
        <Card className="p-8 mb-8 gradient-activated text-white">
          <h1 className="text-3xl font-bold mb-2">Espace Courtier 🤝</h1>
          <p className="text-white/90 mb-6">Gérez vos clients et leurs sinistres avec des outils intelligents</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="lg">
              <Brain className="w-4 h-4 mr-2" />
              Recommandations IA
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              Rapports
            </Button>
          </div>
        </Card>

        {/* Analytics Overview */}
        <BrokerAnalytics />

        {/* Main Management Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="claims" className="space-y-6">
            <TabsList className="grid w-full max-w-[600px] grid-cols-3">
              <TabsTrigger value="claims" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Sinistres
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

            <TabsContent value="clients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Vue clients - En cours de développement
                  </p>
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
