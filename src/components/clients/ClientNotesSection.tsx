import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  Trash2,
  Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ClientNotesSectionProps {
  clientId: string;
}

const noteTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  note: { label: "Note", icon: MessageSquare, color: "bg-blue-100 text-blue-700" },
  call: { label: "Appel", icon: Phone, color: "bg-emerald-100 text-emerald-700" },
  email: { label: "Email", icon: Mail, color: "bg-purple-100 text-purple-700" },
  meeting: { label: "RDV", icon: Calendar, color: "bg-amber-100 text-amber-700" },
  document: { label: "Document", icon: FileText, color: "bg-slate-100 text-slate-700" },
};

export const ClientNotesSection = ({ clientId }: ClientNotesSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<string>("note");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["client-notes", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_notes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");
      
      const { error } = await supabase
        .from("client_notes")
        .insert({
          client_id: clientId,
          broker_id: userData.user.id,
          content: newNote.trim(),
          note_type: noteType,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
      setNewNote("");
      toast({ title: "Note ajoutée" });
    },
    onError: () => {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("client_notes")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
      toast({ title: "Note supprimée" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      addNoteMutation.mutate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="flex gap-1 flex-wrap">
            {Object.entries(noteTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  type="button"
                  variant={noteType === type ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setNoteType(type)}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Button>
              );
            })}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              placeholder="Ajouter une note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
            />
            <Button 
              type="submit" 
              size="sm" 
              className="w-full"
              disabled={!newNote.trim() || addNoteMutation.isPending}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {addNoteMutation.isPending ? "Envoi..." : "Ajouter"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4" />
          Historique ({notes.length})
        </h4>

        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune interaction</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            
            <div className="space-y-3">
              {notes.map((note: any) => {
                const config = noteTypeConfig[note.note_type] || noteTypeConfig.note;
                const Icon = config.icon;
                
                return (
                  <div key={note.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2 top-2 w-4 h-4 rounded-full flex items-center justify-center ${config.color}`}>
                      <Icon className="h-2.5 w-2.5" />
                    </div>
                    
                    <Card className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`text-xs ${config.color}`}>
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(note.created_at), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(note.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
