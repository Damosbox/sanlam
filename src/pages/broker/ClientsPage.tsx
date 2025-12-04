import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BrokerClients } from "@/components/BrokerClients";

export default function ClientsPage() {
  return (
    <Card className="border-0 sm:border shadow-none sm:shadow-sm">
      <CardHeader className="px-0 sm:px-6 pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Portfolio Clients</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <BrokerClients />
      </CardContent>
    </Card>
  );
}