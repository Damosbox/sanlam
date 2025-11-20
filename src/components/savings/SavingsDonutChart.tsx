import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/utils/savingsCalculator";

interface SavingsDonutChartProps {
  totalPremiums: number;
  totalInterests: number;
  totalFees: number;
}

export const SavingsDonutChart = ({ totalPremiums, totalInterests, totalFees }: SavingsDonutChartProps) => {
  const data = [
    { name: "Ce que vous versez", value: totalPremiums, color: "#60a5fa" },
    { name: "Ce que votre argent gagne", value: totalInterests, color: "#34d399" },
    { name: "Ce que vous payez en frais", value: totalFees, color: "#fb923c" }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = totalPremiums + totalInterests + totalFees;
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-strong">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.payload.color }}>
            {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-muted-foreground">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-col gap-3 mt-6">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-[400px] animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            animationDuration={250}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
