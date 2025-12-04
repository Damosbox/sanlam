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
  return <div className="space-y-4 sm:space-y-5">
      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-3 z-10 border-b">
        <Tabs value={activeStatus} onValueChange={setActiveStatus} className="w-full sm:flex-1">
          <TabsList className="h-9 w-full sm:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="all" className="text-xs px-2 sm:px-3 flex-shrink-0">
              Tous ({statusCounts.all})
            </TabsTrigger>
            {Object.entries(statusConfig).map(([status, config]) => <TabsTrigger key={status} value={status} className="text-xs px-2 sm:px-3 flex-shrink-0">
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">{config.label.slice(0, 3)}.</span>
                <span className="ml-1">({statusCounts[status]})</span>
              </TabsTrigger>)}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <ToggleGroup type="single" value={viewDensity} onValueChange={v => v && setViewDensity(v as ViewDensity)} className="border rounded-md">
            <ToggleGroupItem value="compact" aria-label="Compact" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
              <Rows3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="standard" aria-label="Standard" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="card" aria-label="Carte" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 h-8 sm:h-9 px-2 sm:px-3">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau Lead</span>
          </Button>
        </div>
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