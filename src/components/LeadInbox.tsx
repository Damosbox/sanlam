import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageCircle, StickyNote, User, Clock, Plus, UserPlus, FileText, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";
import { z } from "zod";

const leadFormSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(50, "50 caractères max"),
  last_name: z.string().trim().min(1, "Nom requis").max(50, "50 caractères max"),
  email: z.string().trim().email("Email invalide").max(100, "100 caractères max").optional().or(z.literal("")),
  phone: z.string().trim().max(20, "20 caractères max").optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20, "20 caractères max").optional().or(z.literal("")),
  product_interest: z.string().optional(),
  source: z.string().optional(),
});

type Lead = Tables<"leads">;
type LeadNote = Tables<"lead_notes">;
type Product = Tables<"products">;

const statusConfig = {
  nouveau: { label: "Nouveau", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  en_cours: { label: "En cours", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  relance: { label: "Relance", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  converti: { label: "Converti", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  perdu: { label: "Perdu", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

interface LeadCardProps {
  lead: Lead;
  onAddNote: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: Lead["status"]) => void;
  onQuickQuote: (lead: Lead) => void;
}

const LeadCard = ({ lead, onAddNote, onUpdateStatus, onQuickQuote }: LeadCardProps) => {
  const handleCall = () => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, "_blank");
    }
  };

  const handleWhatsApp = () => {
    const number = lead.whatsapp || lead.phone;
    if (number) {
      const cleanNumber = number.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {lead.first_name} {lead.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
              )}
              {lead.product_interest && (
                <Badge variant="outline" className="text-xs">
                  {lead.product_interest}
                </Badge>
              )}
              {lead.source && (
                <Badge variant="secondary" className="text-xs">
                  {lead.source}
                </Badge>
              )}
            </div>

            {lead.next_followup_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Relance: {format(new Date(lead.next_followup_at), "dd MMM yyyy HH:mm", { locale: fr })}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className={statusConfig[lead.status].color}>
              {statusConfig[lead.status].label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: fr })}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
            disabled={!lead.phone}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            disabled={!lead.whatsapp && !lead.phone}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddNote(lead.id)}
          >
            <StickyNote className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onQuickQuote(lead)}
            className="flex-1 gap-1"
          >
            <FileText className="h-4 w-4" />
            Devis rapide
          </Button>
        </div>

        {/* Status Update */}
        <div className="flex items-center gap-1 mt-3">
          <span className="text-xs text-muted-foreground mr-2">Statut:</span>
          {(["nouveau", "en_cours", "relance", "converti", "perdu"] as const).map((status) => (
            <Button
              key={status}
              variant={lead.status === status ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onUpdateStatus(lead.id, status)}
            >
              {statusConfig[status].label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const LeadInbox = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<Lead | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [activeTab, setActiveTab] = useState("nouveau");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    product_interest: "",
    source: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch leads
  const { data: leads, isLoading } = useQuery({
    queryKey: ["broker-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });

  // Fetch products for Quick Quote
  const { data: products } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch notes for selected lead
  const { data: leadNotes } = useQuery({
    queryKey: ["lead-notes", selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return [];
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", selectedLeadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeadNote[];
    },
    enabled: !!selectedLeadId,
  });

  // Update lead status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: Lead["status"] }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status, last_contact_at: new Date().toISOString() })
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      toast({ title: "Statut mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" });
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ leadId, content }: { leadId: string; content: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { error } = await supabase.from("lead_notes").insert({
        lead_id: leadId,
        broker_id: userData.user.id,
        content,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notes", selectedLeadId] });
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      setNoteContent("");
      setNoteDialogOpen(false);
      toast({ title: "Note ajoutée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter la note", variant: "destructive" });
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { error } = await supabase.from("leads").insert({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        product_interest: data.product_interest || null,
        source: data.source || null,
        assigned_broker_id: userData.user.id,
        status: "nouveau",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      setCreateDialogOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        whatsapp: "",
        product_interest: "",
        source: "",
      });
      setFormErrors({});
      toast({ title: "Lead créé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le lead", variant: "destructive" });
    },
  });

  const handleAddNote = (leadId: string) => {
    setSelectedLeadId(leadId);
    setNoteDialogOpen(true);
  };

  const handleSubmitNote = () => {
    if (selectedLeadId && noteContent.trim()) {
      addNoteMutation.mutate({ leadId: selectedLeadId, content: noteContent });
    }
  };

  const handleUpdateStatus = (leadId: string, status: Lead["status"]) => {
    updateStatusMutation.mutate({ leadId, status });
  };

  const handleQuickQuote = (lead: Lead) => {
    setSelectedLeadForQuote(lead);
    setSelectedProductId("");
    setQuoteNotes("");
    // Pre-select product based on lead's interest
    if (lead.product_interest && products) {
      const matchingProduct = products.find(
        (p) => p.category.toLowerCase().includes(lead.product_interest?.toLowerCase() || "") ||
               p.name.toLowerCase().includes(lead.product_interest?.toLowerCase() || "")
      );
      if (matchingProduct) {
        setSelectedProductId(matchingProduct.id);
      }
    }
    setQuoteDialogOpen(true);
  };

  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  const handleCreateQuote = () => {
    if (!selectedLeadForQuote || !selectedProduct) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un produit", variant: "destructive" });
      return;
    }

    // Generate quote summary
    const quoteData = {
      client: `${selectedLeadForQuote.first_name} ${selectedLeadForQuote.last_name}`,
      email: selectedLeadForQuote.email,
      phone: selectedLeadForQuote.phone,
      product: selectedProduct.name,
      category: selectedProduct.category,
      basePremium: selectedProduct.base_premium,
      date: format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr }),
      notes: quoteNotes,
    };

    // Add note to lead with quote details
    if (selectedLeadForQuote.id) {
      supabase.auth.getUser().then(({ data: userData }) => {
        if (userData.user) {
          supabase.from("lead_notes").insert({
            lead_id: selectedLeadForQuote.id,
            broker_id: userData.user.id,
            content: `📋 DEVIS RAPIDE\n\nProduit: ${quoteData.product} (${quoteData.category})\nPrime de base: ${quoteData.basePremium.toLocaleString()} FCFA/mois\nDate: ${quoteData.date}\n${quoteNotes ? `\nNotes: ${quoteNotes}` : ""}`,
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["lead-notes", selectedLeadForQuote.id] });
          });
        }
      });

      // Update lead status to "en_cours"
      updateStatusMutation.mutate({ leadId: selectedLeadForQuote.id, status: "en_cours" });
    }

    toast({
      title: "Devis créé",
      description: `Devis pour ${quoteData.product} envoyé à ${quoteData.client}`,
    });

    setQuoteDialogOpen(false);
    setSelectedLeadForQuote(null);
  };

  const handleCreateLead = () => {
    const result = leadFormSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    createLeadMutation.mutate(formData);
  };

  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Group leads by status
  const leadsByStatus = {
    nouveau: leads?.filter((l) => l.status === "nouveau") || [],
    en_cours: leads?.filter((l) => l.status === "en_cours") || [],
    relance: leads?.filter((l) => l.status === "relance") || [],
    converti: leads?.filter((l) => l.status === "converti") || [],
    perdu: leads?.filter((l) => l.status === "perdu") || [],
  };

  const selectedLead = leads?.find((l) => l.id === selectedLeadId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gestion des Leads</h2>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nouveau Lead
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all ${activeTab === status ? "ring-2 ring-primary" : ""}`}
            onClick={() => setActiveTab(status)}
          >
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${config.color.split(" ")[1]}`}>
                {leadsByStatus[status as keyof typeof leadsByStatus].length}
              </div>
              <div className="text-sm text-muted-foreground">{config.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leads Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(statusConfig).map(([status, config]) => (
            <TabsTrigger key={status} value={status} className="flex items-center gap-1">
              {config.label}
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {leadsByStatus[status as keyof typeof leadsByStatus].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(statusConfig).map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-4">
            {leadsByStatus[status as keyof typeof leadsByStatus].length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucun lead avec le statut "{statusConfig[status as keyof typeof statusConfig].label}"
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {leadsByStatus[status as keyof typeof leadsByStatus].map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onAddNote={handleAddNote}
                    onUpdateStatus={handleUpdateStatus}
                    onQuickQuote={handleQuickQuote}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Ajouter une note pour {selectedLead?.first_name} {selectedLead?.last_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Previous Notes */}
            {leadNotes && leadNotes.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium text-muted-foreground">Notes précédentes:</p>
                {leadNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p>{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(note.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Textarea
              placeholder="Écrivez votre note ici..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmitNote} disabled={!noteContent.trim() || addNoteMutation.isPending}>
                {addNoteMutation.isPending ? "Ajout..." : "Ajouter la note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Lead Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Nouveau Lead
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateFormField("first_name", e.target.value)}
                  placeholder="Jean"
                  className={formErrors.first_name ? "border-destructive" : ""}
                />
                {formErrors.first_name && (
                  <p className="text-xs text-destructive">{formErrors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateFormField("last_name", e.target.value)}
                  placeholder="Dupont"
                  className={formErrors.last_name ? "border-destructive" : ""}
                />
                {formErrors.last_name && (
                  <p className="text-xs text-destructive">{formErrors.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormField("email", e.target.value)}
                placeholder="jean.dupont@exemple.com"
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormField("phone", e.target.value)}
                  placeholder="+225 07 00 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => updateFormField("whatsapp", e.target.value)}
                  placeholder="+225 07 00 00 00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_interest">Produit d'intérêt</Label>
                <Select
                  value={formData.product_interest}
                  onValueChange={(value) => updateFormField("product_interest", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Auto">Auto</SelectItem>
                    <SelectItem value="Habitation">Habitation</SelectItem>
                    <SelectItem value="Santé">Santé</SelectItem>
                    <SelectItem value="Épargne">Épargne</SelectItem>
                    <SelectItem value="Éducation">Éducation</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => updateFormField("source", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Site web">Site web</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Appel entrant">Appel entrant</SelectItem>
                    <SelectItem value="Recommandation">Recommandation</SelectItem>
                    <SelectItem value="Salon/Événement">Salon/Événement</SelectItem>
                    <SelectItem value="Réseaux sociaux">Réseaux sociaux</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateLead} disabled={createLeadMutation.isPending}>
                {createLeadMutation.isPending ? "Création..." : "Créer le lead"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Quote Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Devis Rapide
            </DialogTitle>
          </DialogHeader>

          {selectedLeadForQuote && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations client (pré-remplies)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nom:</span>
                    <p className="font-medium">{selectedLeadForQuote.first_name} {selectedLeadForQuote.last_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedLeadForQuote.email || "Non renseigné"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Téléphone:</span>
                    <p className="font-medium">{selectedLeadForQuote.phone || "Non renseigné"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intérêt:</span>
                    <p className="font-medium">{selectedLeadForQuote.product_interest || "Non spécifié"}</p>
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="space-y-3">
                <Label>Sélectionner un produit *</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un produit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          {product.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Product Details */}
              {selectedProduct && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <h4 className="font-semibold text-primary">{selectedProduct.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                    <span className="text-sm">Prime de base:</span>
                    <span className="text-xl font-bold text-primary">
                      {selectedProduct.base_premium.toLocaleString()} FCFA/mois
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes du devis (optionnel)</Label>
                <Textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Ajoutez des notes personnalisées pour ce devis..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateQuote} 
                  disabled={!selectedProductId}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Créer le devis
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
