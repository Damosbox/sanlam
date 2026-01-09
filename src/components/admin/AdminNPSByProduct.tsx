import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LabelList } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, MessageSquare } from "lucide-react";

interface NPSByProduct {
  productId: string;
  productName: string;
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
}

export const AdminNPSByProduct = () => {
  const { data: npsData, isLoading } = useQuery({
    queryKey: ["nps-by-product"],
    queryFn: async () => {
      // Get all survey responses with NPS scores
      const { data: responses, error: responsesError } = await supabase
        .from("survey_responses")
        .select(`
          nps_score,
          survey_send_id
        `)
        .not("nps_score", "is", null);

      if (responsesError) throw responsesError;
      if (!responses || responses.length === 0) return [];

      // Get survey sends to link to subscriptions
      const surveyIds = responses.map(r => r.survey_send_id).filter(Boolean);
      const { data: sends, error: sendsError } = await supabase
        .from("survey_sends")
        .select("id, trigger_source_id, trigger_source_type")
        .in("id", surveyIds);

      if (sendsError) throw sendsError;

      // Get subscriptions that were triggers
      const subscriptionIds = sends
        ?.filter(s => s.trigger_source_type === "subscription")
        .map(s => s.trigger_source_id)
        .filter(Boolean) || [];

      if (subscriptionIds.length === 0) return [];

      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("id, product_id")
        .in("id", subscriptionIds);

      if (subsError) throw subsError;

      // Get products
      const productIds = [...new Set(subscriptions?.map(s => s.product_id) || [])];
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name");

      if (productsError) throw productsError;

      // Build lookup maps
      const sendToSubscription = new Map(
        sends?.map(s => [s.id, s.trigger_source_id]) || []
      );
      const subscriptionToProduct = new Map(
        subscriptions?.map(s => [s.id, s.product_id]) || []
      );
      const productIdToName = new Map(
        products?.map(p => [p.id, p.name]) || []
      );

      // Group responses by product
      const productScores: Record<string, { scores: number[], name: string }> = {};

      for (const response of responses) {
        if (!response.survey_send_id || response.nps_score === null) continue;
        
        const subscriptionId = sendToSubscription.get(response.survey_send_id);
        if (!subscriptionId) continue;
        
        const productId = subscriptionToProduct.get(subscriptionId);
        if (!productId) continue;
        
        const productName = productIdToName.get(productId) || "Inconnu";
        
        if (!productScores[productId]) {
          productScores[productId] = { scores: [], name: productName };
        }
        productScores[productId].scores.push(response.nps_score);
      }

      // Calculate NPS for each product
      const npsResults: NPSByProduct[] = Object.entries(productScores).map(([productId, data]) => {
        const scores = data.scores;
        const promoters = scores.filter(s => s >= 9).length;
        const passives = scores.filter(s => s >= 7 && s <= 8).length;
        const detractors = scores.filter(s => s <= 6).length;
        const total = scores.length;
        const npsScore = total > 0 
          ? Math.round(((promoters - detractors) / total) * 100)
          : 0;

        return {
          productId,
          productName: data.name,
          totalResponses: total,
          promoters,
          passives,
          detractors,
          npsScore
        };
      });

      // Sort by NPS score descending
      return npsResults.sort((a, b) => b.npsScore - a.npsScore);
    }
  });

  const getNPSColor = (score: number) => {
    if (score >= 50) return "hsl(var(--chart-2))"; // Green
    if (score >= 0) return "hsl(var(--chart-4))"; // Yellow/Orange
    return "hsl(var(--destructive))"; // Red
  };

  const getNPSBgColor = (score: number) => {
    if (score >= 50) return "bg-green-100 text-green-700";
    if (score >= 0) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NPS par Parcours Produit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!npsData || npsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            NPS par Parcours Produit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Aucune donnée NPS disponible</h3>
            <p className="text-muted-foreground max-w-md">
              Les scores NPS apparaîtront ici une fois que les clients auront répondu aux 
              enquêtes de satisfaction liées à leurs souscriptions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const averageNPS = Math.round(
    npsData.reduce((acc, p) => acc + p.npsScore, 0) / npsData.length
  );
  const bestProduct = npsData[0];
  const worstProduct = npsData[npsData.length - 1];
  const totalResponses = npsData.reduce((acc, p) => acc + p.totalResponses, 0);

  const chartData = npsData.map(p => ({
    name: p.productName.length > 20 ? p.productName.substring(0, 20) + "..." : p.productName,
    fullName: p.productName,
    nps: p.npsScore,
    responses: p.totalResponses
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          NPS par Parcours Produit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">NPS Moyen</p>
            <p className={`text-2xl font-bold ${averageNPS >= 0 ? "text-green-600" : "text-red-600"}`}>
              {averageNPS >= 0 ? "+" : ""}{averageNPS}
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Réponses</p>
            <p className="text-2xl font-bold">{totalResponses}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-1 text-sm text-green-700 mb-1">
              <TrendingUp className="h-4 w-4" />
              Meilleur
            </div>
            <p className="text-lg font-semibold text-green-700 truncate" title={bestProduct.productName}>
              {bestProduct.productName}
            </p>
            <p className="text-sm text-green-600">+{bestProduct.npsScore}</p>
          </div>
          
          <div className={`rounded-lg p-4 border ${worstProduct.npsScore < 0 ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
            <div className={`flex items-center gap-1 text-sm mb-1 ${worstProduct.npsScore < 0 ? "text-red-700" : "text-yellow-700"}`}>
              {worstProduct.npsScore < 0 ? <TrendingDown className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              À améliorer
            </div>
            <p className={`text-lg font-semibold truncate ${worstProduct.npsScore < 0 ? "text-red-700" : "text-yellow-700"}`} title={worstProduct.productName}>
              {worstProduct.productName}
            </p>
            <p className={`text-sm ${worstProduct.npsScore < 0 ? "text-red-600" : "text-yellow-600"}`}>
              {worstProduct.npsScore >= 0 ? "+" : ""}{worstProduct.npsScore}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical" 
              margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                domain={[-100, 100]} 
                tickFormatter={(v) => `${v}`}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          NPS: <span className={data.nps >= 0 ? "text-green-600" : "text-red-600"}>
                            {data.nps >= 0 ? "+" : ""}{data.nps}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.responses} réponse{data.responses > 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="nps" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getNPSColor(entry.nps)} />
                ))}
                <LabelList 
                  dataKey="nps" 
                  position="right" 
                  formatter={(value: number) => `${value >= 0 ? "+" : ""}${value}`}
                  style={{ fontSize: 12, fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Produit</th>
                <th className="text-center p-3 font-medium">Réponses</th>
                <th className="text-center p-3 font-medium text-green-600">Promoteurs</th>
                <th className="text-center p-3 font-medium text-yellow-600">Passifs</th>
                <th className="text-center p-3 font-medium text-red-600">Détracteurs</th>
                <th className="text-center p-3 font-medium">NPS</th>
              </tr>
            </thead>
            <tbody>
              {npsData.map((product, idx) => (
                <tr key={product.productId} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-3 font-medium">{product.productName}</td>
                  <td className="text-center p-3">{product.totalResponses}</td>
                  <td className="text-center p-3 text-green-600">{product.promoters}</td>
                  <td className="text-center p-3 text-yellow-600">{product.passives}</td>
                  <td className="text-center p-3 text-red-600">{product.detractors}</td>
                  <td className="text-center p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNPSBgColor(product.npsScore)}`}>
                      {product.npsScore >= 0 ? "+" : ""}{product.npsScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
