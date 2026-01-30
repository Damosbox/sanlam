import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Wallet, ChevronRight, Check } from "lucide-react";
import { GuidedSalesState, MobilePaymentMethod } from "../types";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MobilePaymentStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["mobilePayment"]>) => void;
  onNext: () => void;
}

const paymentMethods: { id: MobilePaymentMethod; label: string; color: string; description: string }[] = [
  { id: "orange_money", label: "Orange Money", color: "bg-orange-500", description: "Paiement Orange Money" },
  { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-500", description: "MTN Mobile Money" },
  { id: "wave", label: "Wave", color: "bg-[#1DC8F2]", description: "Paiement Wave" },
  { id: "moov", label: "Moov Money", color: "bg-blue-600", description: "Moov Mobile Money" },
];

export const MobilePaymentStep = ({ state, onUpdate, onNext }: MobilePaymentStepProps) => {
  const { mobilePayment } = state;
  const paymentDate = mobilePayment.paymentDate ? new Date(mobilePayment.paymentDate) : undefined;

  const isValid = () => {
    return (
      mobilePayment.paymentMethod &&
      mobilePayment.paymentPhone &&
      mobilePayment.paymentDate
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paiement Mobile</h1>
        <p className="text-muted-foreground mt-1">
          Choisissez votre mode de paiement
        </p>
      </div>

      {/* Sélection du mode de paiement */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Mode de paiement *</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const isSelected = mobilePayment.paymentMethod === method.id;
              return (
                <div
                  key={method.id}
                  className={cn(
                    "relative flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => onUpdate({ paymentMethod: method.id })}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white", method.color)}>
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{method.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{method.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Détails du paiement */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Détails du paiement</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment-phone" className="text-sm font-medium">
                N° téléphone de paiement *
              </Label>
              <Input
                id="payment-phone"
                type="tel"
                placeholder="+225 07 12 34 56 78"
                value={mobilePayment.paymentPhone}
                onChange={(e) => onUpdate({ paymentPhone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Date de règlement *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP", { locale: fr }) : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => date && onUpdate({ paymentDate: date.toISOString() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid()} className="gap-2">
          Continuer vers Signature
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
