import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Brain, CheckCircle, TrendingUp, Clock, Users } from "lucide-react";

export default function AIMonitoringPage() {
  const aiMetrics = [
    { 
      model: "OCR Sinistres", 
      accuracy: 94.2, 
      calls: 1250, 
      avgLatency: "1.2s",
      status: "healthy",
      drift: 0.8
    },
    { 
      model: "Recommandations Produits", 
      accuracy: 87.5, 
      calls: 3400, 
      avgLatency: "0.8s",
      status: "healthy",
      drift: 1.2
    },
    { 
      model: "Analyse Concurrentielle", 
      accuracy: 91.3, 
      calls: 450, 
      avgLatency: "2.5s",
      status: "warning",
      drift: 3.5
    },
    { 
      model: "Chat Assistant", 
      accuracy: 89.1, 
      calls: 5200, 
      avgLatency: "1.0s",
      status: "healthy",
      drift: 0.5
    },
  ];

  const complianceAlerts = [
    { type: "RGPD", message: "Consentement explicite requis pour le modèle OCR", severity: "warning" },
    { type: "Biais", message: "Vérification de biais démographique recommandée", severity: "info" },
    { type: "Audit", message: "Audit trimestriel prévu dans 15 jours", severity: "info" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monitoring IA</h1>
        <p className="text-muted-foreground">
          Surveillez les performances, la conformité et le drift des modèles IA.
        </p>
      </div>

      {/* KPIs globaux */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Précision Moyenne</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">90.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appels API (7j)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10,300</div>
            <p className="text-xs text-muted-foreground">+15% vs semaine dernière</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latence Moyenne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.1s</div>
            <p className="text-xs text-muted-foreground">Objectif: &lt;1.5s</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">Utilisant les features IA</p>
          </CardContent>
        </Card>
      </div>

      {/* Métriques par modèle */}
      <Card>
        <CardHeader>
          <CardTitle>Performance des Modèles</CardTitle>
          <CardDescription>Suivi en temps réel de chaque modèle IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {aiMetrics.map((metric) => (
              <div key={metric.model} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{metric.model}</span>
                    <Badge variant={metric.status === "healthy" ? "default" : "secondary"}>
                      {metric.status === "healthy" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {metric.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{metric.calls.toLocaleString()} appels</span>
                    <span>{metric.avgLatency}</span>
                    <span className={metric.drift > 2 ? "text-orange-500" : ""}>
                      Drift: {metric.drift}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={metric.accuracy} className="flex-1" />
                  <span className="text-sm font-medium w-16 text-right">
                    {metric.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes Conformité */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes Conformité & Éthique</CardTitle>
          <CardDescription>Suivi RGPD, biais et audits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceAlerts.map((alert, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  alert.severity === "warning" ? "bg-orange-500/10 border-orange-500/20" : "bg-muted/50"
                }`}
              >
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                  alert.severity === "warning" ? "text-orange-500" : "text-muted-foreground"
                }`} />
                <div>
                  <Badge variant="outline" className="mb-1">{alert.type}</Badge>
                  <p className="text-sm">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
