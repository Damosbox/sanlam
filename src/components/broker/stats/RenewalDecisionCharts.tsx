import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import type { ProductType } from "@/components/broker/dashboard/ProductSelector";

interface RenewalDecisionChartsProps {
  selectedProduct: ProductType;
}

// Churn reasons by product type
const getChurnReasons = (product: ProductType) => {
  switch (product) {
    case "auto":
      return [
        { name: "Véhicule vendu", value: 35, color: "#3b82f6" },
        { name: "Prix concurrent", value: 28, color: "#f59e0b" },
        { name: "Mécontent service", value: 18, color: "#ef4444" },
        { name: "Autre agent", value: 12, color: "#8b5cf6" },
        { name: "Autre", value: 7, color: "#6b7280" },
      ];
    default:
      return [
        { name: "Prix concurrent", value: 30, color: "#3b82f6" },
        { name: "Service", value: 25, color: "#f59e0b" },
        { name: "Produit inadapté", value: 20, color: "#ef4444" },
        { name: "Autre agent", value: 15, color: "#8b5cf6" },
        { name: "Autre", value: 10, color: "#6b7280" },
      ];
  }
};

export const RenewalDecisionCharts = ({ selectedProduct }: RenewalDecisionChartsProps) => {
  const chartsData = [
    {
      title: "Assuré atteint",
      data: [
        { name: "Atteint", value: 82, color: "#22c55e" },
        { name: "Non atteint", value: 18, color: "#e5e7eb" },
      ],
    },
    {
      title: "Souhaite renouveler",
      data: [
        { name: "Va passer en agence", value: 45, color: "#3b82f6" },
        { name: "Envoyer attestation", value: 35, color: "#22c55e" },
        { name: "Indécis", value: 20, color: "#f59e0b" },
      ],
    },
    {
      title: "Conclusion affaire",
      data: [
        { name: "Conclue", value: 68, color: "#22c55e" },
        { name: "En cours", value: 22, color: "#3b82f6" },
        { name: "Perdue", value: 10, color: "#ef4444" },
      ],
    },
    {
      title: "Problème téléphone",
      data: [
        { name: "Non disponible", value: 45, color: "#f59e0b" },
        { name: "Ne répond pas", value: 35, color: "#6b7280" },
        { name: "N° erroné", value: 20, color: "#ef4444" },
      ],
    },
    {
      title: "Ne souhaite pas renouveler",
      data: getChurnReasons(selectedProduct),
    },
    {
      title: "Change d'assureur",
      data: [
        { name: "Prix plus bas", value: 40, color: "#3b82f6" },
        { name: "Mécontent service", value: 25, color: "#f59e0b" },
        { name: "Autre agent", value: 20, color: "#8b5cf6" },
        { name: "Déménagement", value: 15, color: "#6b7280" },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {chartsData.map((chart) => (
        <Card key={chart.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chart.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {chart.data.slice(0, 3).map((item) => (
                <div key={item.name} className="flex items-center gap-1 text-[10px]">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
