import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Send } from "lucide-react";

interface QuotationSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "save" | "send";
  defaultValues?: { lastName?: string; firstName?: string; email?: string };
  onConfirm: (info: {
    lastName: string;
    firstName: string;
    email: string;
    channel?: string;
  }) => void;
}

export const QuotationSaveDialog = ({
  open,
  onOpenChange,
  mode,
  defaultValues,
  onConfirm,
}: QuotationSaveDialogProps) => {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState("email");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setLastName(defaultValues?.lastName || "");
      setFirstName(defaultValues?.firstName || "");
      setEmail(defaultValues?.email || "");
      setChannel("email");
      setErrors({});
    }
  }, [open, defaultValues]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!lastName.trim()) newErrors.lastName = "Le nom est requis";
    else if (lastName.trim().length > 100)
      newErrors.lastName = "100 caractères maximum";

    if (!firstName.trim()) newErrors.firstName = "Le prénom est requis";
    else if (firstName.trim().length > 100)
      newErrors.firstName = "100 caractères maximum";

    if (!email.trim()) newErrors.email = "L'adresse e-mail est requise";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Format e-mail invalide";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm({
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      email: email.trim(),
      ...(mode === "send" ? { channel } : {}),
    });
    onOpenChange(false);
  };

  const isSave = mode === "save";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSave ? (
              <Save className="h-5 w-5 text-primary" />
            ) : (
              <Send className="h-5 w-5 text-primary" />
            )}
            {isSave ? "Sauvegarder la cotation" : "Envoyer la cotation"}
          </DialogTitle>
          <DialogDescription>
            {isSave
              ? "Renseignez les informations du client pour sauvegarder cette cotation."
              : "Renseignez les informations du client et choisissez le canal d'envoi."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nom */}
          <div className="space-y-1.5">
            <Label htmlFor="qs-lastName">Nom *</Label>
            <Input
              id="qs-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom de famille"
              maxLength={100}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName}</p>
            )}
          </div>

          {/* Prénom */}
          <div className="space-y-1.5">
            <Label htmlFor="qs-firstName">Prénom *</Label>
            <Input
              id="qs-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              maxLength={100}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="qs-email">Adresse e-mail *</Label>
            <Input
              id="qs-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              maxLength={255}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Canal d'envoi (mode send uniquement) */}
          {mode === "send" && (
            <div className="space-y-2">
              <Label>Canal d'envoi *</Label>
              <RadioGroup
                value={channel}
                onValueChange={setChannel}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="ch-email" />
                  <Label htmlFor="ch-email" className="font-normal cursor-pointer">
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="ch-whatsapp" />
                  <Label htmlFor="ch-whatsapp" className="font-normal cursor-pointer">
                    WhatsApp
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="ch-sms" />
                  <Label htmlFor="ch-sms" className="font-normal cursor-pointer">
                    SMS
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            {isSave ? (
              <>
                <Save className="h-4 w-4" />
                Sauvegarder
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
