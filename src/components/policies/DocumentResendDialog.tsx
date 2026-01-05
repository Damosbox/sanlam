import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Send, 
  Mail, 
  MessageCircle, 
  Smartphone, 
  Loader2,
  FileText,
  Edit2,
  Check
} from "lucide-react";

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string | null;
}

interface DocumentResendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: Document[];
  clientEmail?: string | null;
  clientPhone?: string | null;
  policyNumber: string;
  subscriptionId: string;
}

const channelConfig = {
  email: { label: "Email", icon: Mail, color: "text-blue-600" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600" },
  sms: { label: "SMS", icon: Smartphone, color: "text-amber-600" },
};

export const DocumentResendDialog = ({
  open,
  onOpenChange,
  documents,
  clientEmail,
  clientPhone,
  policyNumber,
  subscriptionId,
}: DocumentResendDialogProps) => {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["email"]);
  const [email, setEmail] = useState(clientEmail || "");
  const [phone, setPhone] = useState(clientPhone || "");
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [sending, setSending] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDocs(documents.map(d => d.id));
      setSelectedChannels(["email"]);
      setEmail(clientEmail || "");
      setPhone(clientPhone || "");
      setEditingEmail(false);
      setEditingPhone(false);
    }
  }, [open, documents, clientEmail, clientPhone]);

  const toggleDoc = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSend = async () => {
    if (selectedDocs.length === 0) {
      toast.error("Veuillez sélectionner au moins un document");
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error("Veuillez sélectionner au moins un canal d'envoi");
      return;
    }
    if (selectedChannels.includes("email") && !email) {
      toast.error("L'email est requis pour l'envoi par email");
      return;
    }
    if ((selectedChannels.includes("whatsapp") || selectedChannels.includes("sms")) && !phone) {
      toast.error("Le téléphone est requis pour l'envoi par SMS/WhatsApp");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-policy-documents", {
        body: {
          documentIds: selectedDocs,
          channels: selectedChannels,
          email: email || undefined,
          phone: phone || undefined,
          policyNumber,
          subscriptionId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${selectedDocs.length} document(s) envoyé(s) avec succès`);
        onOpenChange(false);
      } else {
        toast.error(data?.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Error sending documents:", error);
      toast.error("Impossible d'envoyer les documents");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Renvoyer les documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Documents selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Documents à envoyer</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleDoc(doc.id)}
                >
                  <Checkbox
                    checked={selectedDocs.includes(doc.id)}
                    onCheckedChange={() => toggleDoc(doc.id)}
                  />
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{doc.document_name}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedDocs.length} / {documents.length} sélectionné(s)
            </div>
          </div>

          <Separator />

          {/* Channels selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Canaux d'envoi</Label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(channelConfig).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = selectedChannels.includes(key);
                return (
                  <Button
                    key={key}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`gap-1.5 ${isSelected ? "" : config.color}`}
                    onClick={() => toggleChannel(key)}
                  >
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Contact info */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Informations de contact</Label>
            
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2">
                {editingEmail ? (
                  <>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingEmail(false)}
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-3 py-2 text-sm bg-muted rounded-md">
                      {email || <span className="text-muted-foreground italic">Non renseigné</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingEmail(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Téléphone</Label>
              <div className="flex items-center gap-2">
                {editingPhone ? (
                  <>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 07 XX XX XX XX"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingPhone(false)}
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-3 py-2 text-sm bg-muted rounded-md">
                      {phone || <span className="text-muted-foreground italic">Non renseigné</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingPhone(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
