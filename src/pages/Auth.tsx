import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Shield, Users, Briefcase, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthView = "welcome" | "login" | "signup";
type SpaceType = "client" | "broker" | null;

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBrokerAccess = searchParams.get("broker") === "true";
  
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<AuthView>("welcome");
  const [selectedSpace, setSelectedSpace] = useState<SpaceType>(isBrokerAccess ? "broker" : null);
  const [phoneAuth, setPhoneAuth] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const redirectBasedOnRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("role", { ascending: true })
      .limit(1)
      .maybeSingle();
    
    const role = roleData?.role ?? "customer";
    
    if (role === "broker" || role === "admin") {
      navigate("/b2b/dashboard");
    } else {
      navigate("/b2c");
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await redirectBasedOnRole(session.user.id);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setTimeout(() => {
          redirectBasedOnRole(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isBrokerSignup = selectedSpace === "broker";
      
      if (view === "signup") {
        const redirectUrl = isBrokerSignup 
          ? `${window.location.origin}/b2b/dashboard`
          : `${window.location.origin}/b2c`;
        
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
        
        if (isBrokerSignup && data.user) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'broker'
            });
          
          if (roleError) {
            console.error('Erreur lors de l\'ajout du rôle broker:', roleError);
          }
        }
        
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
      toast.error(error.message || "Une erreur est survenue");
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
          redirectTo: `${window.location.origin}/auth`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  const goBack = () => {
    if (phoneAuth) {
      setPhoneAuth(false);
      setOtpSent(false);
      setPhone("");
      setOtp("");
    } else if (view !== "welcome") {
      setView("welcome");
      setEmail("");
      setPassword("");
      setDisplayName("");
    }
  };

  // Welcome View
  if (view === "welcome" && !phoneAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-background to-sky-50/30 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardContent className="pt-8 pb-6 px-8">
            {/* Shield Icon */}
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Bienvenue chez Sanlam-Allianz
              </h1>
              <p className="text-muted-foreground">
                Connectez-vous pour accéder à vos services d'assurance
              </p>
            </div>

            {/* Main Actions */}
            <div className="space-y-3 mb-6">
              <Button 
                className="w-full h-12 text-base font-semibold"
                onClick={() => setView("login")}
              >
                Se connecter
              </Button>
              
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase">
                  ou
                </span>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-medium"
                onClick={() => setView("signup")}
              >
                Créer un compte
              </Button>
            </div>

            {/* Space Selector */}
            <div className="mb-6">
              <p className="text-center text-sm font-medium text-primary mb-4">
                Choisissez votre espace
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedSpace("client")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
                    selectedSpace === "client"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Users className={cn(
                    "h-6 w-6",
                    selectedSpace === "client" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="text-center">
                    <p className={cn(
                      "font-semibold text-sm",
                      selectedSpace === "client" ? "text-primary" : "text-foreground"
                    )}>
                      Espace Client
                    </p>
                    <p className="text-xs text-muted-foreground">Particuliers</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedSpace("broker")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
                    selectedSpace === "broker"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Briefcase className={cn(
                    "h-6 w-6",
                    selectedSpace === "broker" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="text-center">
                    <p className={cn(
                      "font-semibold text-sm",
                      selectedSpace === "broker" ? "text-primary" : "text-foreground"
                    )}>
                      Espace Partenaire
                    </p>
                    <p className="text-xs text-muted-foreground">Professionnels</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground">
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

  // Login/Signup Forms
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-background to-sky-50/30 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardContent className="pt-6 pb-6 px-8">
          {/* Back Button */}
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                {selectedSpace === "broker" ? (
                  <Briefcase className="h-6 w-6 text-primary" />
                ) : (
                  <Users className="h-6 w-6 text-primary" />
                )}
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {phoneAuth 
                ? "Connexion par téléphone"
                : view === "signup" 
                  ? "Créer un compte" 
                  : "Se connecter"
              }
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedSpace === "broker" ? "Espace Partenaire" : "Espace Client"}
            </p>
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
                  <Label htmlFor="password">Mot de passe</Label>
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
                  onClick={handleFacebookAuth}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continuer avec Facebook
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

              <div className="text-center text-sm mt-4">
                <button
                  type="button"
                  onClick={() => setView(view === "signup" ? "login" : "signup")}
                  className="text-primary hover:underline"
                >
                  {view === "signup" ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handlePhoneAuth} className="space-y-4">
                {view === "signup" && !otpSent && (
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
                    placeholder="+33612345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={otpSent}
                    required
                  />
                </div>
                {otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Code de vérification</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                )}
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {otpSent ? "Vérifier le code" : "Envoyer le code"}
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            En vous connectant, vous acceptez nos conditions d'utilisation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
