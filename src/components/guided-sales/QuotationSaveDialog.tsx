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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Send } from "lucide-react";

interface QuotationSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "save" | "send";
  optional?: boolean;
  defaultValues?: {
    lastName?: string;
    firstName?: string;
    email?: string;
    gender?: string;
    birthDate?: string;
    phone?: string;
    employmentType?: string;
  };
  onConfirm: (info: {
    lastName: string;
    firstName: string;
    email: string;
    gender?: string;
    birthDate?: string;
    phone?: string;
    employmentType?: string;
    channel?: string;
  }) => void;
  onDismiss?: () => void;
}

const employmentOptions = [
  { value: "fonctionnaire", label: "Fonctionnaire" },
  { value: "salarie", label: "Salarié" },
  { value: "exploitant_agricole", label: "Exploitant agricole" },
  { value: "artisan", label: "Artisan" },
  { value: "religieux", label: "Religieux" },
  { value: "retraite", label: "Retraité" },
  { value: "sans_profession", label: "Sans profession" },
  { value: "agent_commercial", label: "Agent commercial" },
  { value: "autres", label: "Autres" },
];

export const QuotationSaveDialog = ({
  open,
  onOpenChange,
  mode,
  optional = false,
  defaultValues,
  onConfirm,
  onDismiss,
}: QuotationSaveDialogProps) => {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [channel, setChannel] = useState("email");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setLastName(defaultValues?.lastName || "");
      setFirstName(defaultValues?.firstName || "");
      setGender(defaultValues?.gender || "");
      setBirthDate(defaultValues?.birthDate || "");
      setPhone(defaultValues?.phone || "");
      setEmail(defaultValues?.email || "");
      setEmploymentType(defaultValues?.employmentType || "");
      setChannel("email");
      setErrors({});
    }
  }, [open, defaultValues]);

  const validate = (): boolean => {
    if (optional) return true;
    const newErrors: Record<string, string> = {};
    if (!lastName.trim()) newErrors.lastName = "Le nom est requis";
    else if (lastName.trim().length > 100)
      newErrors.lastName = "100 caractères maximum";

    if (!firstName.trim()) newErrors.firstName = "Le prénom est requis";
    else if (firstName.trim().length > 100)
      newErrors.firstName = "100 caractères maximum";

    // Validation conditionnelle par canal
    if (mode === "send") {
      const needsEmail = channel === "email" || channel === "tous";
      const needsPhone = channel === "whatsapp" || channel === "sms" || channel === "tous";

      if (needsEmail) {
        if (!email.trim()) newErrors.email = "L'adresse e-mail est requise";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
          newErrors.email = "Format e-mail invalide";
      }
      if (needsPhone) {
        if (!phone.trim()) newErrors.phone = "Le numéro de téléphone est requis";
      }
    } else {
      // Mode save : email obligatoire
      if (!email.trim()) newErrors.email = "L'adresse e-mail est requise";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        newErrors.email = "Format e-mail invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm({
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      email: email.trim(),
      ...(gender ? { gender } : {}),
      ...(birthDate ? { birthDate } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(employmentType ? { employmentType } : {}),
      ...(mode === "send" ? { channel } : {}),
    });
    onOpenChange(false);
  };

  const isSave = mode === "save";

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && optional && onDismiss) {
        onDismiss();
      }
      onOpenChange(v);
    }}>
      <DialogContent className="sm:max-w-lg">
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
          {/* Nom & Prénom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Sexe & Date de naissance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sexe</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculin">Masculin</SelectItem>
                  <SelectItem value="feminin">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qs-birthDate">Date de naissance</Label>
              <Input
                id="qs-birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </div>

          {/* Téléphone & Type d'emploi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="qs-phone">
                Numéro de téléphone
                {mode === "send" && (channel === "whatsapp" || channel === "sms" || channel === "tous") && " *"}
              </Label>
              <Input
                id="qs-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 XX XX XX XX"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Type d'emploi</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {employmentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          {optional ? (
            <Button variant="outline" onClick={() => {
              onDismiss?.();
              onOpenChange(false);
            }}>
              Passer
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          )}
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
