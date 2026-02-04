import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  CalendarIcon, 
  Upload, 
  FileText, 
  X, 
  Loader2,
  Search,
  Car,
  Home,
  Heart,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientOption {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  type: "client" | "prospect";
}

interface PolicyOption {
  id: string;
  policy_number: string;
  product_name: string;
  product_category: string;
}

const claimTypes = [
  { value: "accident", label: "Accident", icon: Car, category: "auto" },
  { value: "theft", label: "Vol", icon: Shield, category: "auto" },
  { value: "damage", label: "Dégât", icon: Home, category: "mrh" },
  { value: "health", label: "Santé", icon: Heart, category: "sante" },
  { value: "other", label: "Autre", icon: FileText, category: "all" },
];

export default function ClaimNewPage() {
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [claimType, setClaimType] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);

  // Fetch clients and prospects for the broker
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["broker-clients-prospects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch clients
      const { data: brokerClients } = await supabase
        .from("broker_clients")
        .select(`
          client_id,
          profiles:client_id (id, display_name, email, phone)
        `)
        .eq("broker_id", user.id);

      // Fetch prospects (converted leads)
      const { data: leads } = await supabase
        .from("leads")
        .select("id, first_name, last_name, email, phone")
        .eq("assigned_broker_id", user.id)
        .eq("status", "converti");

      const clientOptions: ClientOption[] = [];

      // Add clients
      (brokerClients || []).forEach((bc: any) => {
        if (bc.profiles) {
          clientOptions.push({
            id: bc.profiles.id,
            display_name: bc.profiles.display_name || "Client",
            email: bc.profiles.email,
            phone: bc.profiles.phone,
            type: "client",
          });
        }
      });

      // Add prospects (converted)
      (leads || []).forEach((lead: any) => {
        clientOptions.push({
          id: lead.id,
          display_name: `${lead.first_name} ${lead.last_name}`,
          email: lead.email,
          phone: lead.phone,
          type: "prospect",
        });
      });

      return clientOptions;
    },
  });

  // Fetch policies for selected client
  const { data: policies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ["client-policies", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];

      const { data } = await supabase
        .from("subscriptions")
        .select(`
          id,
          policy_number,
          products (name, category)
        `)
        .eq("user_id", selectedClientId)
        .eq("status", "active");

      return (data || []).map((sub: any) => ({
        id: sub.id,
        policy_number: sub.policy_number,
        product_name: sub.products?.name || "Produit",
        product_category: sub.products?.category || "",
      })) as PolicyOption[];
    },
    enabled: !!selectedClientId,
  });

  // Create claim mutation
  const createClaimMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (!selectedPolicyId || !claimType || !incidentDate) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      // Map claim type to database enum
      const claimTypeMap: Record<string, "Auto" | "Habitation" | "Santé"> = {
        accident: "Auto",
        theft: "Auto",
        damage: "Habitation",
        health: "Santé",
        other: "Auto",
      };

      const { data, error } = await supabase
        .from("claims")
        .insert([{
          policy_id: selectedPolicyId,
          user_id: selectedClientId,
          claim_type: claimTypeMap[claimType] || "Auto",
          incident_date: incidentDate.toISOString(),
          description: description || null,
          location: location || null,
          status: "Submitted",
          assigned_broker_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Sinistre déclaré avec succès");
      navigate("/b2b/claims");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la déclaration");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (documents.length + files.length > 5) {
      toast.error("Maximum 5 documents autorisés");
      return;
    }
    setDocuments([...documents, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const filteredClients = clients.filter((c) =>
    c.display_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch)
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/b2b/claims")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Nouvelle Déclaration de Sinistre</h1>
          <p className="text-sm text-muted-foreground">
            Déclarez un sinistre pour un client ou prospect
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  1
                </span>
                Sélection du Client
              </CardTitle>
              <CardDescription>
                Recherchez et sélectionnez le client concerné
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {clientsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                  {filteredClients.slice(0, 10).map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setSelectedPolicyId("");
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border text-left transition-colors",
                        selectedClientId === client.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div>
                        <p className="font-medium text-sm">{client.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.email || client.phone || "—"}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        client.type === "client"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      )}>
                        {client.type === "client" ? "Client" : "Prospect"}
                      </span>
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Aucun client trouvé
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Policy Selection */}
          <Card className={cn(!selectedClientId && "opacity-60 pointer-events-none")}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  2
                </span>
                Police Concernée
              </CardTitle>
              <CardDescription>
                Sélectionnez la police d'assurance liée au sinistre
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : policies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune police active pour ce client
                </p>
              ) : (
                <div className="grid gap-2">
                  {policies.map((policy) => (
                    <button
                      key={policy.id}
                      type="button"
                      onClick={() => setSelectedPolicyId(policy.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border text-left transition-colors",
                        selectedPolicyId === policy.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div>
                        <p className="font-medium text-sm">{policy.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          N° {policy.policy_number}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {policy.product_category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Claim Details */}
          <Card className={cn(!selectedPolicyId && "opacity-60 pointer-events-none")}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  3
                </span>
                Détails du Sinistre
              </CardTitle>
              <CardDescription>
                Renseignez les informations relatives au sinistre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Claim Type */}
              <div className="space-y-2">
                <Label>Type de sinistre *</Label>
                <Select value={claimType} onValueChange={setClaimType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {claimTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Incident Date */}
              <div className="space-y-2">
                <Label>Date de survenance *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !incidentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {incidentDate
                        ? format(incidentDate, "PPP", { locale: fr })
                        : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={incidentDate}
                      onSelect={setIncidentDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Lieu du sinistre</Label>
                <Input
                  placeholder="Adresse ou lieu de l'incident"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Décrivez les circonstances du sinistre..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <Label>Documents justificatifs</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    id="documents"
                    className="hidden"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="documents"
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Cliquez pour ajouter des photos ou documents
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Max 5 fichiers (JPG, PNG, PDF)
                    </span>
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">
                          {doc.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">
                    {selectedClient?.display_name || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Police</span>
                  <span className="font-medium">
                    {selectedPolicy?.policy_number || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produit</span>
                  <span className="font-medium">
                    {selectedPolicy?.product_name || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {claimTypes.find((t) => t.value === claimType)?.label || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {incidentDate
                      ? format(incidentDate, "dd/MM/yyyy")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Documents</span>
                  <span className="font-medium">{documents.length}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button
                  className="w-full"
                  disabled={
                    !selectedClientId ||
                    !selectedPolicyId ||
                    !claimType ||
                    !incidentDate ||
                    createClaimMutation.isPending
                  }
                  onClick={() => createClaimMutation.mutate()}
                >
                  {createClaimMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Soumettre la déclaration"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
