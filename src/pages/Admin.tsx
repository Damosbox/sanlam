import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Shield, TrendingUp, AlertCircle, Database, Zap, FileText, Users } from "lucide-react";
import { AdminClaimsTable } from "@/components/AdminClaimsTable";
import { AdminUsersTable } from "@/components/AdminUsersTable";
import { AdminAnalytics } from "@/components/AdminAnalytics";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        {/* Welcome Banner */}
        <Card className="p-8 mb-8 gradient-success text-white">
          <h1 className="text-3xl font-bold mb-2">Tableau de bord Admin 🛡️</h1>
          <p className="text-white/90 mb-6">Gestion complète des sinistres, utilisateurs et analytics</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="lg">
              <Brain className="w-4 h-4 mr-2" />
              Supervision IA
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Shield className="w-4 h-4 mr-2" />
              Logs RGPD
            </Button>
          </div>
        </Card>

        {/* Analytics Overview */}
        <AdminAnalytics />

        {/* Main Management Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="claims" className="space-y-6">
            <TabsList className="grid w-full max-w-[600px] grid-cols-3">
              <TabsTrigger value="claims" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Sinistres
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                IA & Conformité
              </TabsTrigger>
            </TabsList>

            <TabsContent value="claims" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Sinistres</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminClaimsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminUsersTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              {/* AI Monitoring */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[hsl(var(--bright-green))]/10 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-[hsl(var(--bright-green))]" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Modèle de Recommandation</h3>
                        <p className="text-sm text-muted-foreground">gemini-2.5-flash</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[hsl(var(--bright-green))]/10 text-[hsl(var(--bright-green))]">
                      Opérationnel
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Précision</p>
                      <p className="text-2xl font-bold">94.2%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Latence moy.</p>
                      <p className="text-2xl font-bold">1.2s</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Requêtes/jour</p>
                      <p className="text-2xl font-bold">2.4K</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Confiance moyenne</span>
                      <span className="text-sm font-semibold">92%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-[hsl(var(--bright-green))] w-[92%]" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">OCR Sinistres</h3>
                        <p className="text-sm text-muted-foreground">Extraction documents</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[hsl(var(--bright-green))]/10 text-[hsl(var(--bright-green))]">
                      Opérationnel
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Taux succès</p>
                      <p className="text-2xl font-bold">97.8%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Temps moy.</p>
                      <p className="text-2xl font-bold">3.5s</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Docs/jour</p>
                      <p className="text-2xl font-bold">845</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* NPS & Compliance */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">NPS & Satisfaction</h3>
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-[hsl(var(--bright-green))]">68%</p>
                      <p className="text-sm text-muted-foreground mt-1">Promoteurs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-[hsl(var(--yellow))]">24%</p>
                      <p className="text-sm text-muted-foreground mt-1">Passifs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-[hsl(var(--red))]">8%</p>
                      <p className="text-sm text-muted-foreground mt-1">Détracteurs</p>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                    <div className="bg-[hsl(var(--bright-green))]" style={{ width: '68%' }} />
                    <div className="bg-[hsl(var(--yellow))]" style={{ width: '24%' }} />
                    <div className="bg-[hsl(var(--red))]" style={{ width: '8%' }} />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-[hsl(var(--red))]/10 to-[hsl(var(--orange))]/10">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-[hsl(var(--red))]" />
                    <h3 className="font-semibold">Alertes & Conformité</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-background border-l-4 border-[hsl(var(--yellow))]">
                      <p className="font-medium text-sm mb-1">RGPD: Demande d'accès</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Client ID #4582 - Échéance: 72h
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Traiter
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-background border-l-4 border-[hsl(var(--orange))]">
                      <p className="font-medium text-sm mb-1">Drift détecté: Scoring</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Variation +4.2% sur 7 jours
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Analyser
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* APIs & Integration */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">APIs & Intégrations</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Mobile Money</span>
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--bright-green))]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">WhatsApp Business</span>
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--bright-green))]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">ERP Sanlam</span>
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--bright-green))]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Lovable AI Gateway</span>
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--bright-green))]" />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
