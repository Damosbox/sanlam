import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BrokerClients } from "@/components/BrokerClients";

export default function ClientsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <BrokerClients />
      </CardContent>
    </Card>
  );
}
