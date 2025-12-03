import { Card, CardContent } from "@/components/ui/card";
import { LeadInbox } from "@/components/LeadInbox";

export default function LeadsPage() {
  return (
    <Card className="p-0">
      <CardContent className="p-0">
        <LeadInbox />
      </CardContent>
    </Card>
  );
}
