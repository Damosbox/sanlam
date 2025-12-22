import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerSubscriptions } from "@/components/BrokerSubscriptions";
import { BrokerQuotations } from "@/components/BrokerQuotations";
import { FileText, FolderOpen } from "lucide-react";

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState("policies");

  return (
    <Card className="border-0 sm:border shadow-none sm:shadow-sm">
      <CardHeader className="px-0 sm:px-6 pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Gestion</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="policies" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Polices
            </TabsTrigger>
            <TabsTrigger value="quotations" className="gap-2">
              <FileText className="h-4 w-4" />
              Cotations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="policies">
            <BrokerSubscriptions />
          </TabsContent>
          
          <TabsContent value="quotations">
            <BrokerQuotations />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
