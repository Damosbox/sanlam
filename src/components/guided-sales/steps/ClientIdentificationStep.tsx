import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Upload, User, Loader2, CheckCircle, CreditCard, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GuidedSalesState } from "../types";
import { cn } from "@/lib/utils";

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
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

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

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    setOcrConfidence(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        const { data: result, error } = await supabase.functions.invoke("ocr-identity", {
          body: { imageBase64: base64, documentType: data.identityDocumentType },
        });

        if (error) throw error;

        if (result?.extracted) {
          const extracted = result.extracted;
          onUpdate({
            firstName: extracted.firstName || data.firstName,
            lastName: extracted.lastName || data.lastName,
            identityDocumentType: extracted.documentType || data.identityDocumentType,
            identityDocumentNumber: extracted.documentNumber || data.identityDocumentNumber,
          });
          setOcrConfidence(result.confidence);
          toast({
            title: "Document analysé",
            description: `Nom/Prénom et numéro extraits (Confiance: ${Math.round(result.confidence * 100)}%)`,
          });
        } else {
          toast({
            title: "Extraction partielle",
            description: "Certaines informations n'ont pas pu être extraites",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR error:", error);
      toast({
        title: "Erreur OCR",
        description: "Impossible d'analyser le document",
        variant: "destructive",
      });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const isLinked = !!data.linkedContactId;
  const canProceed = data.firstName && data.lastName && data.phone;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Identification du Client</h2>
        <p className="text-muted-foreground mt-1">
          Recherchez un contact existant ou saisissez les informations
        </p>
      </div>

      {/* Search Section */}
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
        <CardContent>
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={searchOpen}
                className="w-full justify-start text-muted-foreground"
              >
                <Search className="mr-2 h-4 w-4" />
                {isLinked
                  ? `${data.firstName} ${data.lastName}`
                  : "Rechercher un prospect ou client..."}
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

          {isLinked && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 text-xs h-7"
                  onClick={() =>
                    onUpdate({
                      linkedContactId: undefined,
                      linkedContactType: undefined,
                      firstName: "",
                      lastName: "",
                      phone: "",
                      email: "",
                    })
                  }
                >
                  Dissocier
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Identity Document Section - MOVED TO 2ND POSITION */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Document d'identité
          </CardTitle>
          <CardDescription>
            Scannez le document pour remplir automatiquement Nom, Prénom et numéro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OCR Upload */}
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleOcrUpload}
              className="hidden"
              id="ocr-upload"
              disabled={isOcrLoading}
            />
            <label htmlFor="ocr-upload" className="cursor-pointer">
              {isOcrLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Analyse en cours...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez pour scanner le document
                  </span>
                  <span className="text-xs text-muted-foreground">
                    CNI, Passeport, Permis de conduire
                  </span>
                </div>
              )}
            </label>
          </div>

          {ocrConfidence !== null && (
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-sm",
              ocrConfidence >= 0.8 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            )}>
              <CheckCircle className="h-4 w-4" />
              Document analysé - Confiance: {Math.round(ocrConfidence * 100)}%
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="docType">Type de document</Label>
              <Select
                value={data.identityDocumentType}
                onValueChange={(v) => onUpdate({ identityDocumentType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNI">Carte Nationale d'Identité</SelectItem>
                  <SelectItem value="Passeport">Passeport</SelectItem>
                  <SelectItem value="Permis">Permis de conduire</SelectItem>
                  <SelectItem value="Carte consulaire">Carte consulaire</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="docNumber">Numéro de la pièce</Label>
              <Input
                id="docNumber"
                value={data.identityDocumentNumber}
                onChange={(e) => onUpdate({ identityDocumentNumber: e.target.value })}
                placeholder="N° de la pièce"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Section - NOW 3RD */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations du client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="+225 07 XX XX XX XX"
              />
            </div>
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
