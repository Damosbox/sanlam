import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ScoringManualOverrideTable() {
  return (
    <Card>
      <CardContent className="p-8 text-center space-y-2">
        <Badge variant="outline">V2</Badge>
        <p className="text-sm text-muted-foreground">
          Le workflow de modification manuelle du score (avec approbation supérieur)
          sera activé dans la V2.
        </p>
      </CardContent>
    </Card>
  );
}