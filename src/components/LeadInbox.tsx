import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UserPlus, LayoutList, LayoutGrid, Rows3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { LeadsDataTable } from "./leads/LeadsDataTable";
import { LeadCards } from "./leads/LeadCards";
import { LeadDetailSheet } from "./leads/LeadDetailSheet";
import { QuickQuoteDialog } from "./leads/QuickQuoteDialog";
import { CreateLeadDialog } from "./leads/CreateLeadDialog";
import { statusConfig } from "./leads/LeadStatusBadge";
type Lead = Tables<"leads">;
type ViewDensity = "compact" | "standard" | "card";
export const LeadInbox = () => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [viewDensity, setViewDensity] = useState<ViewDensity>("standard");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteDialogLead, setQuoteDialogLead] = useState<Lead | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch leads
  const {
    data: leads = [],
    isLoading
  } = useQuery({
    queryKey: ["broker-leads"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("leads").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data as Lead[];
    }
  });

  // Filter leads by status
  const filteredLeads = useMemo(() => {
    if (activeStatus === "all") return leads;
    return leads.filter(l => l.status === activeStatus);
  }, [leads, activeStatus]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: leads.length
    };
    Object.keys(statusConfig).forEach(status => {
      counts[status] = leads.filter(l => l.status === status).length;
    });
    return counts;
  }, [leads]);

  // Update lead status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      leadId,
      status
    }: {
      leadId: string;
      status: Lead["status"];
    }) => {
      const {
        error
      } = await supabase.from("leads").update({
        status,
        last_contact_at: new Date().toISOString()
      }).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["broker-leads"]
      });
      toast({
        title: "Lead mis à jour"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        variant: "destructive"
      });
    }
  });
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };
  const handleQuickQuote = (lead: Lead) => {
    setQuoteDialogLead(lead);
    setQuoteDialogOpen(true);
  };
  const handleStatusChange = (leadId: string, status: Lead["status"]) => {
    updateStatusMutation.mutate({
      leadId,
      status
    });
    if (selectedLead?.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        status
      });
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>;
  }
  return <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          
          
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nouveau Lead
        </Button>
      </div>

      {/* Stats Cards */}
      

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur-sm py-3 z-10 border-b">
        <Tabs value={activeStatus} onValueChange={setActiveStatus} className="flex-1">
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">
              Tous ({statusCounts.all})
            </TabsTrigger>
            {Object.entries(statusConfig).map(([status, config]) => <TabsTrigger key={status} value={status} className="text-xs px-3">
                {config.label} ({statusCounts[status]})
              </TabsTrigger>)}
          </TabsList>
        </Tabs>

        <ToggleGroup type="single" value={viewDensity} onValueChange={v => v && setViewDensity(v as ViewDensity)} className="border rounded-md">
          <ToggleGroupItem value="compact" aria-label="Compact" className="h-9 w-9 p-0">
            <Rows3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="standard" aria-label="Standard" className="h-9 w-9 p-0">
            <LayoutList className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="card" aria-label="Carte" className="h-9 w-9 p-0">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Data Display */}
      {viewDensity === "card" ? <LeadCards leads={filteredLeads} onSelectLead={handleSelectLead} onQuickQuote={handleQuickQuote} /> : <LeadsDataTable leads={filteredLeads} density={viewDensity} onSelectLead={handleSelectLead} />}

      {/* Side Panel */}
      <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} onQuickQuote={handleQuickQuote} onStatusChange={handleStatusChange} />

      {/* Quick Quote Dialog */}
      <QuickQuoteDialog lead={quoteDialogLead} open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen} onStatusChange={handleStatusChange} />

      {/* Create Lead Dialog */}
      <CreateLeadDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>;
};