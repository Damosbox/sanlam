import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import sanlamLogo from "@/assets/logo_sanlam.svg";

type AuthView = "login" | "signup";

export default function ClientAuth() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const [phoneAuth, setPhoneAuth] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/b2c");
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setTimeout(() => {
          navigate("/b2c");
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "signup") {
        const redirectUrl = `${window.location.origin}/b2c`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: displayName,
            }
          }
        });
        if (error) throw error;
        
        toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Connexion réussie !");
      }
    } catch (error: any) {
      let message = "Une erreur est survenue";
      if (error.message?.includes("Invalid login credentials")) {
        message = "Email ou mot de passe incorrect";
      } else if (error.message?.includes("Email not confirmed")) {
        message = "Veuillez confirmer votre email avant de vous connecter";
      } else if (error.message?.includes("User already registered")) {
        message = "Un compte existe déjà avec cet email";
      } else if (error.message?.includes("Password should be at least")) {
        message = "Le mot de passe doit contenir au moins 6 caractères";
      } else if (error.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: {
            data: {
              full_name: displayName,
            }
          }
        });
        if (error) throw error;
        setOtpSent(true);
        toast.success("Code envoyé par SMS !");
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms'
        });
        if (error) throw error;
        toast.success("Connexion réussie !");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/client`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Veuillez entrer votre email");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/client`,
      });
      if (error) throw error;
      toast.success("Un email de réinitialisation a été envoyé");
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (phoneAuth) {
      setPhoneAuth(false);
      setOtpSent(false);
      setPhone("");
      setOtp("");
    } else if (view === "signup") {
      setView("login");
      setDisplayName("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-background to-sky-50/30 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl animate-fade-in">
        <CardContent className="pt-6 pb-6 px-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={sanlamLogo} alt="Sanlam Allianz" className="h-12 w-auto" />
          </div>

          {/* Space Badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              <Users className="h-4 w-4" />
              Espace Particulier
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-foreground">
              {phoneAuth 
                ? "Connexion par téléphone"
                : view === "signup" 
                  ? "Créer un compte" 
                  : "Connexion"
              }
            </h1>
          </div>

          {!phoneAuth ? (
            <>
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {view === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nom complet</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Jean Dupont"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    {view === "login" && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {view === "signup" ? "Créer mon compte" : "Se connecter"}
                </Button>
              </form>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase">
                  ou
                </span>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setPhoneAuth(true)}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Continuer avec téléphone
                </Button>
              </div>

              {view === "login" && (
                <div className="text-center text-sm mt-4">
                  <span className="text-muted-foreground">Vous n'avez pas de compte ? </span>
                  <button
                    type="button"
                    onClick={() => setView("signup")}
                    className="text-primary font-medium hover:underline"
                  >
                    Inscrivez-vous
                  </button>
                </div>
              )}

              {view === "signup" && (
                <div className="text-center text-sm mt-4">
                  <span className="text-muted-foreground">Déjà un compte ? </span>
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="text-primary font-medium hover:underline"
                  >
                    Connectez-vous
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <form onSubmit={handlePhoneAuth} className="space-y-4">
                {!otpSent ? (
                  <>
                    {view === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Nom complet</Label>
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="Jean Dupont"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Numéro de téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+225 07 XX XX XX XX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Code de vérification</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Un code a été envoyé au {phone}
                    </p>
                  </div>
                )}
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {otpSent ? "Vérifier le code" : "Recevoir un code"}
                </Button>
              </form>
              
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={goBack}
              >
                Retour
              </Button>
            </>
          )}

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            En vous connectant, vous acceptez nos{" "}
            <a href="#" className="text-primary hover:underline">conditions d'utilisation</a>
            {" "}et notre{" "}
            <a href="#" className="text-primary hover:underline">politique de confidentialité</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
