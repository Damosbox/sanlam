import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BrokerClaimsTable } from "@/components/BrokerClaimsTable";

export default function ClaimsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sinistres à examiner</CardTitle>
      </CardHeader>
      <CardContent>
        <BrokerClaimsTable />
      </CardContent>
    </Card>
  );
}
