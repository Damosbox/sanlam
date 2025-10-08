import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

interface DamageDetail {
  zone: string;
  damageType: string;
  severity: number;
  notes: string;
  imageUrl?: string;
}

interface DamageFormProps {
  zone: string;
  onSave: (detail: DamageDetail) => void;
  onCancel: () => void;
}

const damageTypes = [
  "Choc",
  "Bris de vitre",
  "Rayure",
  "Feu",
  "Inondation",
  "Vol",
  "Autre"
];

export const DamageForm = ({ zone, onSave, onCancel }: DamageFormProps) => {
  const [damageType, setDamageType] = useState("");
  const [severity, setSeverity] = useState([3]);
  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        toast.success("Photo ajoutée");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!damageType) {
      toast.error("Veuillez sélectionner un type de dommage");
      return;
    }

    onSave({
      zone,
      damageType,
      severity: severity[0],
      notes,
      imageUrl: imagePreview || undefined
    });
  };

  return (
    <Card className="border-primary shadow-lg">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Détails - {zone}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Type de dommage</Label>
          <Select value={damageType} onValueChange={setDamageType}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez le type" />
            </SelectTrigger>
            <SelectContent>
              {damageTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Gravité (1-5)</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={severity}
              onValueChange={setSeverity}
              min={1}
              max={5}
              step={1}
              className="flex-1"
            />
            <span className="text-lg font-bold text-primary w-8 text-center">
              {severity[0]}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes complémentaires</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Décrivez les dégâts..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Photo de la zone</Label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id={`damage-photo-${zone}`}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById(`damage-photo-${zone}`)?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            {imagePreview ? "Changer la photo" : "Ajouter une photo"}
          </Button>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Damage preview"
              className="w-full h-32 object-cover rounded-lg border"
            />
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};