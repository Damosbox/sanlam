import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface EducationChartProps {
  totalPremiumsPaid: number;
  totalRentReceived: number;
  totalFees: number;
}

export const EducationChart = ({
  totalPremiumsPaid,
  totalRentReceived,
  totalFees
}: EducationChartProps) => {
  const data = [
    { name: "Primes versées", value: totalPremiumsPaid, color: "#60a5fa" },
    { name: "Rente totale reçue", value: totalRentReceived, color: "#34d399" },
    { name: "Frais", value: totalFees, color: "#fb923c" }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / (totalPremiumsPaid + totalRentReceived + totalFees)) * 100).toFixed(1);
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-muted-foreground">
            {data.value.toLocaleString('fr-FR')} Fcfa ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={140}
            paddingAngle={2}
            dataKey="value"
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
