import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, Send, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhoneOTPVerificationProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onVerified: () => void;
  isVerified: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const PhoneOTPVerification = ({
  label,
  value,
  onChange,
  onVerified,
  isVerified,
  placeholder = "+221 77 000 00 00",
  disabled = false,
}: PhoneOTPVerificationProps) => {
  const { toast } = useToast();
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const sendOTP = async () => {
    if (!value || value.length < 8) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("otp-verification", {
        body: { action: "send", phoneNumber: value },
      });

      if (error) throw error;

      if (data.success) {
        setShowOTPInput(true);
        // For demo purposes only - remove in production
        if (data.demoOtp) {
          setDemoOtp(data.demoOtp);
        }
        toast({
          title: "Code envoyé",
          description: "Un code de vérification a été envoyé",
        });
      } else {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("OTP send error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le code",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const verifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer le code à 6 chiffres",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("otp-verification", {
        body: { action: "verify", phoneNumber: value, otpCode },
      });

      // Handle edge function error response (400 status returns as data, not error)
      if (error) {
        console.error("OTP verify error:", error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier le code",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        onVerified();
        setShowOTPInput(false);
        setDemoOtp(null);
        toast({
          title: "Vérifié",
          description: "Numéro vérifié avec succès",
        });
      } else {
        // OTP was invalid or expired - show user-friendly message
        toast({
          title: "Code incorrect",
          description: data?.error || "Le code entré est invalide ou a expiré. Veuillez réessayer.",
          variant: "destructive",
        });
        // Clear the input so user can try again
        setOtpCode("");
      }
    } catch (error) {
      console.error("OTP verify error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le code. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Phone className="h-4 w-4" />
        {label}
        {isVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
      </Label>
      
      <div className="flex gap-2">
        <Input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isVerified}
          className={isVerified ? "border-green-500 bg-green-50" : ""}
        />
        {!isVerified && value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={sendOTP}
            disabled={sending || !value}
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Vérifier
              </>
            )}
          </Button>
        )}
      </div>

      {showOTPInput && !isVerified && (
        <div className="mt-3 p-3 border rounded-lg bg-muted/50 space-y-3">
          <p className="text-sm text-muted-foreground">
            Entrez le code à 6 chiffres envoyé au {value}
          </p>
          
          {/* Demo mode notice - remove in production */}
          {demoOtp && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Mode démo - Code: <strong>{demoOtp}</strong>
            </p>
          )}
          
          <div className="flex items-center gap-3">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            
            <Button
              type="button"
              size="sm"
              onClick={verifyOTP}
              disabled={verifying || otpCode.length !== 6}
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Valider"
              )}
            </Button>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={sendOTP}
            disabled={sending}
            className="text-xs"
          >
            Renvoyer le code
          </Button>
        </div>
      )}
    </div>
  );
};
