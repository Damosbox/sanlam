import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UserPlus, LayoutList, Rows3, Search, Download, Users, Inbox, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PortfolioDataTable, PortfolioItem } from "@/components/portfolio/PortfolioDataTable";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { ClientDetailSheet } from "@/components/clients/ClientDetailSheet";
import { QuickQuoteDialog } from "@/components/leads/QuickQuoteDialog";
import { CreateLeadDialog } from "@/components/leads/CreateLeadDialog";
import type { Tables } from "@/integrations/supabase/types";
import * as XLSX from "xlsx";
type Lead = Tables<"leads">;
type ViewDensity = "compact" | "standard";
export default function PortfolioPage() {
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewDensity, setViewDensity] = useState<ViewDensity>("standard");
  const [searchQuery, setSearchQuery] = useState("");

  // Lead states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadSheetOpen, setLeadSheetOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteDialogLead, setQuoteDialogLead] = useState<Lead | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogLead, setEditDialogLead] = useState<Lead | null>(null);

  // Client states
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientSheetOpen, setClientSheetOpen] = useState(false);

  // Fetch prospects (leads)
  const {
    data: leads = [],
    isLoading: leadsLoading
  } = useQuery({
    queryKey: ["broker-leads"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("leads").select("*").neq("status", "converti").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data as Lead[];
    }
  });

  // Fetch clients
  const {
    data: clients = [],
    isLoading: clientsLoading
  } = useQuery({
    queryKey: ["broker-clients"],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Fetch active clients
      const {
        data: brokerClients,
        error: brokerClientsError
      } = await supabase.from("broker_clients").select(`
          client_id,
          profiles!broker_clients_client_id_fkey (
            id,
            display_name,
            email,
            phone
          )
        `).eq("broker_id", user.id);
      if (brokerClientsError) throw brokerClientsError;

      // Fetch converted leads (pending clients)
      const {
        data: convertedLeads,
        error: leadsError
      } = await supabase.from("leads").select("*").eq("assigned_broker_id", user.id).eq("status", "converti").order("updated_at", {
        ascending: false
      });
      if (leadsError) throw leadsError;

      // Get stats for active clients
      const activeClientsWithStats = await Promise.all((brokerClients || []).map(async brokerClient => {
        const profile = brokerClient.profiles as any;
        const {
          count: claimsCount
        } = await supabase.from("claims").select("*", {
          count: 'exact',
          head: true
        }).eq("user_id", brokerClient.client_id);
        const {
          count: subscriptionsCount
        } = await supabase.from("subscriptions").select("*", {
          count: 'exact',
          head: true
        }).eq("user_id", brokerClient.client_id);
        return {
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          phone: profile.phone,
          claimsCount: claimsCount || 0,
          subscriptionsCount: subscriptionsCount || 0,
          client_status: "active" as const
        };
      }));

      // Transform converted leads to pending clients
      const pendingClients = (convertedLeads || []).map(lead => ({
        id: lead.id,
        display_name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone || lead.whatsapp,
        claimsCount: 0,
        subscriptionsCount: 0,
        client_status: "pending" as const,
        product_interest: lead.product_interest
      }));
      return [...activeClientsWithStats, ...pendingClients];
    }
  });

  // Transform data to unified format
  const portfolioItems = useMemo((): PortfolioItem[] => {
    const prospectItems: PortfolioItem[] = leads.map(lead => ({
      id: lead.id,
      type: "prospect",
      display_name: `${lead.first_name} ${lead.last_name}`,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      status: lead.status,
      product_interest: lead.product_interest,
      source: lead.source
    }));
    const clientItems: PortfolioItem[] = clients.map(client => ({
      id: client.id,
      type: "client",
      display_name: client.display_name || "N/A",
      email: client.email,
      phone: client.phone,
      client_status: client.client_status,
      product_interest: "product_interest" in client ? client.product_interest : undefined,
      claimsCount: client.claimsCount,
      subscriptionsCount: client.subscriptionsCount
    }));
    return [...prospectItems, ...clientItems];
  }, [leads, clients]);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = portfolioItems;
    if (activeTab === "prospects") {
      result = result.filter(item => item.type === "prospect");
    } else if (activeTab === "clients") {
      result = result.filter(item => item.type === "client");
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => item.display_name?.toLowerCase().includes(query) || item.first_name?.toLowerCase().includes(query) || item.last_name?.toLowerCase().includes(query));
    }
    return result;
  }, [portfolioItems, activeTab, searchQuery]);

  // Counts
  const counts = useMemo(() => ({
    all: portfolioItems.length,
    prospects: portfolioItems.filter(i => i.type === "prospect").length,
    clients: portfolioItems.filter(i => i.type === "client").length
  }), [portfolioItems]);

  // Export
  const exportToExcel = () => {
    const data = filteredItems.map(item => ({
      Nom: item.display_name,
      Type: item.type === "prospect" ? "Prospect" : "Client",
      Téléphone: item.phone || "",
      Email: item.email || "",
      Produit: item.product_interest || "",
      Statut: item.type === "prospect" ? item.status : item.client_status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Portefeuille");
    XLSX.writeFile(wb, "portefeuille.xlsx");
    toast({
      title: "Export Excel réussi"
    });
  };
  const exportToCSV = () => {
    const data = filteredItems.map(item => ({
      Nom: item.display_name,
      Type: item.type === "prospect" ? "Prospect" : "Client",
      Téléphone: item.phone || "",
      Email: item.email || "",
      Produit: item.product_interest || "",
      Statut: item.type === "prospect" ? item.status : item.client_status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "portefeuille.csv";
    link.click();
    toast({
      title: "Export CSV réussi"
    });
  };

  // Handlers
  const handleSelectItem = (item: PortfolioItem) => {
    if (item.type === "prospect") {
      const lead = leads.find(l => l.id === item.id);
      if (lead) {
        setSelectedLead(lead);
        setLeadSheetOpen(true);
      }
    } else {
      const client = clients.find(c => c.id === item.id);
      if (client) {
        setSelectedClient(client);
        setClientSheetOpen(true);
      }
    }
  };
  const handleQuickQuote = (lead: Lead) => {
    setQuoteDialogLead(lead);
    setQuoteDialogOpen(true);
  };
  const handleEditLead = (lead: Lead) => {
    setEditDialogLead(lead);
    setEditDialogOpen(true);
  };
  const handleStatusChange = (leadId: string, status: Lead["status"]) => {
    if (selectedLead?.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        status
      });
    }
  };
  const isLoading = leadsLoading || clientsLoading;
  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>;
  }
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mon Portefeuille</h1>
      </div>
      
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-3 z-10 border-b">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par nom..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 h-8 sm:h-9 px-2 sm:px-3">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:flex-1">
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3 gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Tous ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="prospects" className="text-xs px-3 gap-1.5">
                <Inbox className="h-3.5 w-3.5" />
                Prospects ({counts.prospects})
              </TabsTrigger>
              <TabsTrigger value="clients" className="text-xs px-3 gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Clients ({counts.clients})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <ToggleGroup type="single" value={viewDensity} onValueChange={v => v && setViewDensity(v as ViewDensity)} className="border rounded-md">
            <ToggleGroupItem value="compact" aria-label="Compact" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
              <Rows3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="standard" aria-label="Standard" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Table */}
      <PortfolioDataTable items={filteredItems} density={viewDensity} onSelectItem={handleSelectItem} />

      {/* Lead Detail Sheet */}
      <LeadDetailSheet lead={selectedLead} open={leadSheetOpen} onOpenChange={setLeadSheetOpen} onQuickQuote={handleQuickQuote} onStatusChange={handleStatusChange} onEditLead={handleEditLead} />

      {/* Client Detail Sheet */}
      <ClientDetailSheet client={selectedClient} open={clientSheetOpen} onOpenChange={setClientSheetOpen} />

      {/* Quick Quote Dialog */}
      <QuickQuoteDialog lead={quoteDialogLead} open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen} onStatusChange={handleStatusChange} />

      {/* Create Lead Dialog */}
      <CreateLeadDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Edit Lead Dialog */}
      <CreateLeadDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} lead={editDialogLead} mode="edit" />
    </div>;
}