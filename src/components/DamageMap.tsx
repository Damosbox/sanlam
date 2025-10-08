import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface DamageZone {
  id: string;
  name: string;
  selected: boolean;
}

interface DamageMapProps {
  type: "Auto" | "Habitation" | "Santé";
  onZoneSelect: (zoneId: string, zoneName: string) => void;
  selectedZones: string[];
}

const autoZones: DamageZone[] = [
  { id: "pare-brise", name: "Pare-brise", selected: false },
  { id: "capot", name: "Capot", selected: false },
  { id: "aile-gauche", name: "Aile gauche", selected: false },
  { id: "aile-droite", name: "Aile droite", selected: false },
  { id: "portiere-gauche", name: "Portière gauche", selected: false },
  { id: "portiere-droite", name: "Portière droite", selected: false },
  { id: "pare-choc-avant", name: "Pare-choc avant", selected: false },
  { id: "pare-choc-arriere", name: "Pare-choc arrière", selected: false },
  { id: "toit", name: "Toit", selected: false },
  { id: "coffre", name: "Coffre", selected: false },
];

const habitationZones: DamageZone[] = [
  { id: "facade", name: "Façade", selected: false },
  { id: "toiture", name: "Toiture", selected: false },
  { id: "murs", name: "Murs", selected: false },
  { id: "fenetres", name: "Fenêtres", selected: false },
  { id: "portes", name: "Portes", selected: false },
  { id: "plomberie", name: "Plomberie", selected: false },
  { id: "electricite", name: "Électricité", selected: false },
  { id: "sol", name: "Sol", selected: false },
];

export const DamageMap = ({ type, onZoneSelect, selectedZones }: DamageMapProps) => {
  const zones = type === "Auto" ? autoZones : habitationZones;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === "Auto" ? (
            <Car className="h-5 w-5 text-primary" />
          ) : (
            <Home className="h-5 w-5 text-primary" />
          )}
          Zones d'impact
        </CardTitle>
        <CardDescription>
          Sélectionnez les zones endommagées sur le schéma ci-dessous
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* SVG Interactive Map */}
        <div className="bg-muted/30 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-3">
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => onZoneSelect(zone.id, zone.name)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-200",
                  "hover:scale-105 hover:shadow-md",
                  selectedZones.includes(zone.id)
                    ? "bg-primary/10 border-primary ring-2 ring-primary ring-offset-2"
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                <div className="text-sm font-medium text-center">
                  {zone.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected zones summary */}
        {selectedZones.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Zones sélectionnées:</p>
            <div className="flex flex-wrap gap-2">
              {selectedZones.map((zoneId) => {
                const zone = zones.find(z => z.id === zoneId);
                return (
                  <Badge 
                    key={zoneId} 
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {zone?.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};