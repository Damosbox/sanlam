import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, User, Loader2, UserPlus, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GuidedSalesState } from "../types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

  const isLinked = !!data.linkedContactId;
  const hasManualData = !isLinked && (data.firstName || data.lastName || data.phone || data.email);
  const canProceed = data.firstName && data.lastName && data.phone;

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
