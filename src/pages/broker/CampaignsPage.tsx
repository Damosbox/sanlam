import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Clock } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Campagnes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestion des campagnes marketing
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <Card className="border-border/60">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Bientôt disponible</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Cette fonctionnalité est en cours de développement. Vous pourrez bientôt créer 
            et gérer des campagnes marketing ciblées vers vos clients et prospects.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
