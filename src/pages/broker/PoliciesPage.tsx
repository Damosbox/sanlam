import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BrokerSubscriptions } from "@/components/BrokerSubscriptions";

export default function PoliciesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Polices assignées</CardTitle>
      </CardHeader>
      <CardContent>
        <BrokerSubscriptions />
      </CardContent>
    </Card>
  );
}
