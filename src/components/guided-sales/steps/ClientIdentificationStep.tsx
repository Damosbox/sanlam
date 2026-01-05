import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Loader2, UserPlus, Pencil, ChevronDown, ChevronUp, FileImage, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GuidedSalesState } from "../types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PhoneOTPVerification } from "@/components/leads/PhoneOTPVerification";

interface ClientIdentificationStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["clientIdentification"]>) => void;
  onNext: () => void;
}

type SearchResult = {
  id: string;
  type: "prospect" | "client";
  displayName: string;
  phone: string | null;
  email: string | null;
};

export const ClientIdentificationStep = ({ state, onUpdate, onNext }: ClientIdentificationStepProps) => {
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const data = state.clientIdentification;

  // Search leads and profiles
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["contact-search", searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];

      const results: SearchResult[] = [];

      // Search leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, first_name, last_name, phone, email")
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(5);

      if (leads) {
        results.push(
          ...leads.map((l) => ({
            id: l.id,
            type: "prospect" as const,
            displayName: `${l.first_name} ${l.last_name}`,
            phone: l.phone,
            email: l.email,
          }))
        );
      }

      // Search profiles (clients)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, phone, email")
        .or(`display_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(5);

      if (profiles) {
        results.push(
          ...profiles.map((p) => ({
            id: p.id,
            type: "client" as const,
            displayName: p.display_name || "Client",
            phone: p.phone,
            email: p.email,
          }))
        );
      }

      return results;
    },
    enabled: searchTerm.length >= 2,
  });

  const handleSelectContact = async (contact: SearchResult) => {
    setSearchOpen(false);
    setSearchTerm("");
    setIsFormExpanded(false);

    // Fetch full data based on type
    if (contact.type === "prospect") {
      const { data: lead } = await supabase
        .from("leads")
        .select("*")
        .eq("id", contact.id)
        .single();

      if (lead) {
        onUpdate({
          firstName: lead.first_name,
          lastName: lead.last_name,
          phone: lead.phone || "",
          email: lead.email || "",
          linkedContactId: lead.id,
          linkedContactType: "prospect",
        });
      }
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", contact.id)
        .single();

      if (profile) {
        const nameParts = (profile.display_name || "").split(" ");
        onUpdate({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          phone: profile.phone || "",
          email: profile.email || "",
          linkedContactId: profile.id,
          linkedContactType: "client",
        });
      }
    }

    toast({ title: "Contact sélectionné", description: contact.displayName });
  };

  const handleNewContact = () => {
    // Clear any linked contact and expand form
    onUpdate({
      linkedContactId: undefined,
      linkedContactType: undefined,
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    });
    setIsFormExpanded(true);
  };

  const handleDissociate = () => {
    onUpdate({
      linkedContactId: undefined,
      linkedContactType: undefined,
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    });
    setIsFormExpanded(false);
  };

  const handleEditInfo = () => {
    setIsFormExpanded(true);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingOCR(true);
    try {
      const base64 = await fileToBase64(file);

      const { data: ocrData, error } = await supabase.functions.invoke("ocr-identity", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (ocrData?.extracted) {
        const extracted = ocrData.extracted;
        onUpdate({
          firstName: extracted.firstName || data.firstName || "",
          lastName: extracted.lastName || data.lastName || "",
          identityDocumentType: extracted.documentType || "",
          identityDocumentNumber: extracted.documentNumber || "",
        });
        setIsFormExpanded(true);
        toast({
          title: "Données extraites",
          description: "Les informations ont été préremplies depuis la pièce d'identité",
        });
      } else {
        toast({
          title: "OCR incomplet",
          description: "Impossible d'extraire toutes les informations. Veuillez les saisir manuellement.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast({
        title: "Erreur OCR",
        description: "Impossible de lire la pièce d'identité",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOCR(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isLinked = !!data.linkedContactId;
  const hasManualData = !isLinked && (data.firstName || data.lastName || data.phone || data.email);
  const canProceed = data.firstName && data.lastName && data.phone && isPhoneVerified;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Identification du Client</h2>
        <p className="text-muted-foreground mt-1">
          Recherchez un contact existant ou créez un nouveau contact
        </p>
      </div>

      {/* Unified Search & Client Info Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Rechercher un contact
          </CardTitle>
          <CardDescription>
            Recherchez par nom ou numéro de téléphone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar and New Contact Button - Always visible when no linked contact and form not expanded with data */}
          {!isLinked && !hasManualData && !isFormExpanded && (
            <div className="flex gap-3">
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="flex-1 justify-start text-muted-foreground"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Rechercher un prospect ou client...
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Nom, téléphone..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList>
                      {searchLoading && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      )}
                      <CommandEmpty>Aucun résultat</CommandEmpty>
                      <CommandGroup heading="Résultats">
                        {searchResults.map((result) => (
                          <CommandItem
                            key={`${result.type}-${result.id}`}
                            onSelect={() => handleSelectContact(result)}
                            className="cursor-pointer"
                          >
                            <User className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <div className="font-medium">{result.displayName}</div>
                              <div className="text-xs text-muted-foreground">
                                {result.phone || result.email}
                              </div>
                            </div>
                            <Badge variant={result.type === "prospect" ? "outline" : "default"} className="text-xs">
                              {result.type === "prospect" ? "Prospect" : "Client"}
                            </Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button 
                variant="secondary" 
                onClick={handleNewContact}
                className="flex-shrink-0"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Nouveau contact
              </Button>
            </div>
          )}

          {/* Linked Contact Display */}
          {isLinked && !isFormExpanded && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{data.firstName} {data.lastName}</span>
                      <Badge variant={data.linkedContactType === "prospect" ? "outline" : "default"} className="text-xs flex-shrink-0">
                        {data.linkedContactType === "prospect" ? "Prospect" : "Client"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      {data.phone && <span>{data.phone}</span>}
                      {data.phone && data.email && <span>•</span>}
                      {data.email && <span className="truncate">{data.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleEditInfo}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground"
                    onClick={handleDissociate}
                  >
                    Dissocier
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Manual data display (when form is collapsed and has data but no linked contact) */}
          {hasManualData && !isFormExpanded && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{data.firstName} {data.lastName}</span>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        Nouveau
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      {data.phone && <span>{data.phone}</span>}
                      {data.phone && data.email && <span>•</span>}
                      {data.email && <span className="truncate">{data.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleEditInfo}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground"
                    onClick={handleDissociate}
                  >
                    Effacer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Expandable Form */}
          <Collapsible open={isFormExpanded} onOpenChange={setIsFormExpanded}>
            {(isLinked || hasManualData) && (
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {isFormExpanded ? "Masquer le formulaire" : "Modifier les informations"}
                  </span>
                  {isFormExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            )}

            <CollapsibleContent className="space-y-4 pt-4">
              {/* Header for new contact form */}
              {!isLinked && !hasManualData && (
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-medium">Nouveau contact</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground"
                    onClick={() => setIsFormExpanded(false)}
                  >
                    Annuler
                  </Button>
                </div>
              )}

              {/* ID Document OCR Scanner */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileImage className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Scanner une pièce d'identité</p>
                      <p className="text-sm text-muted-foreground">
                        CNI, Passeport ou Permis de conduire
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      ref={fileInputRef}
                      onChange={handleOCRUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingOCR}
                    >
                      {isProcessingOCR ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Scanner
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={data.firstName}
                    onChange={(e) => onUpdate({ firstName: e.target.value })}
                    placeholder="Prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={data.lastName}
                    onChange={(e) => onUpdate({ lastName: e.target.value })}
                    placeholder="Nom de famille"
                  />
                </div>
              </div>

              {/* Identity Document Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de pièce d'identité</Label>
                  <Select
                    value={data.identityDocumentType || ""}
                    onValueChange={(v) => onUpdate({ identityDocumentType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNI">CNI</SelectItem>
                      <SelectItem value="Passeport">Passeport</SelectItem>
                      <SelectItem value="Permis de conduire">Permis de conduire</SelectItem>
                      <SelectItem value="Carte consulaire">Carte consulaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identityDocumentNumber">Numéro du document</Label>
                  <Input
                    id="identityDocumentNumber"
                    value={data.identityDocumentNumber || ""}
                    onChange={(e) => onUpdate({ identityDocumentNumber: e.target.value })}
                    placeholder="N° du document"
                  />
                </div>
              </div>

              {/* Phone with OTP Verification */}
              <div className="grid grid-cols-2 gap-4">
                <PhoneOTPVerification
                  label="Téléphone WhatsApp *"
                  value={data.phone}
                  onChange={(value) => onUpdate({ phone: value })}
                  onVerified={() => setIsPhoneVerified(true)}
                  isVerified={isPhoneVerified}
                  placeholder="+225 07 XX XX XX XX"
                />
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => onUpdate({ email: e.target.value })}
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>

              {/* Collapse button when editing linked contact */}
              {(isLinked || hasManualData) && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFormExpanded(false)}
                  >
                    Terminer la modification
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          size="lg"
        >
          Continuer vers l'analyse du besoin
        </Button>
      </div>
    </div>
  );
};
