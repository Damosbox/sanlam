import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, Users } from "lucide-react";
import { LeadInbox } from "@/components/LeadInbox";
import { BrokerClients } from "@/components/BrokerClients";

export default function PortfolioPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "prospects";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mon Portefeuille</h1>
      </div>
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="prospects" className="gap-2">
            <Inbox className="h-4 w-4" />
            Prospects
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prospects" className="mt-0">
          <Card className="p-0 border-0 shadow-none">
            <CardContent className="p-0">
              <LeadInbox />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-0">
          <BrokerClients />
        </TabsContent>
      </Tabs>
    </div>
  );
}
