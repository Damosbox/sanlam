import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import type { ProductType } from "@/components/broker/dashboard/ProductSelector";

interface ContactIndicatorsTableProps {
  selectedProduct: ProductType;
  showDetails?: boolean;
}

export const ContactIndicatorsTable = ({ selectedProduct, showDetails = false }: ContactIndicatorsTableProps) => {
  // Mock data - would come from database
  const indicators = {
    toCall: 156,
    contacted: 128,
    contactedPercent: 82,
    reached: 105,
    reachedPercent: 82,
    phoneIssue: 23,
    phoneIssuePercent: 18,
  };

  const pieData = [
    { name: "Atteints", value: indicators.reached, color: "hsl(var(--success))" },
    { name: "Problème tél.", value: indicators.phoneIssue, color: "hsl(var(--warning))" },
    { name: "Non contactés", value: indicators.toCall - indicators.contacted, color: "hsl(var(--muted))" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Indicateurs de Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Indicateur</TableHead>
                  <TableHead className="text-right">Nombre</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Personnes à appeler</TableCell>
                  <TableCell className="text-right">{indicators.toCall}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Contactées</TableCell>
                  <TableCell className="text-right">{indicators.contacted}</TableCell>
                  <TableCell className="text-right text-blue-600">{indicators.contactedPercent}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Assurés atteints</TableCell>
                  <TableCell className="text-right">{indicators.reached}</TableCell>
                  <TableCell className="text-right text-emerald-600">{indicators.reachedPercent}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Problème téléphone</TableCell>
                  <TableCell className="text-right">{indicators.phoneIssue}</TableCell>
                  <TableCell className="text-right text-amber-600">{indicators.phoneIssuePercent}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Pie Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {showDetails && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Détail des problèmes téléphone</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-lg font-bold">12</div>
                <div className="text-xs text-muted-foreground">Non disponible</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-lg font-bold">7</div>
                <div className="text-xs text-muted-foreground">Ne répond pas</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-lg font-bold">4</div>
                <div className="text-xs text-muted-foreground">N° erroné</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
