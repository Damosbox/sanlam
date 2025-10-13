import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Shield,
  Car,
  Home,
  Heart,
  Briefcase,
  FileText,
  CreditCard,
  Download,
  Phone,
  AlertTriangle,
  Search,
  Grid3x3,
  List,
} from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  policy_number: string;
  monthly_premium: number;
  start_date: string;
  end_date: string;
  status: string;
  user_id: string;
  product_id: string;
  selected_coverages: any;
  payment_method: string | null;
  assigned_broker_id: string | null;
  products: {
    name: string;
    category: string;
    coverages: any;
  } | null;
}

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'auto':
      return <Car className="w-4 h-4" />;
    case 'habitation':
      return <Home className="w-4 h-4" />;
    case 'santé':
    case 'sante':
      return <Heart className="w-4 h-4" />;
    case 'professionnelle':
      return <Briefcase className="w-4 h-4" />;
    default:
      return <Shield className="w-4 h-4" />;
  }
};

const getStatusBadge = (status: string, endDate: string) => {
  const daysUntilExpiry = differenceInDays(new Date(endDate), new Date());
  
  if (status === 'active' && daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
    return (
      <Badge variant="default" className="bg-warning/10 text-warning border-warning/20">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Expire bientôt
      </Badge>
    );
  }
  
  const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
    active: "default",
    cancelled: "destructive",
    expired: "secondary",
  };

  const statusText: Record<string, string> = {
    active: "Active",
    cancelled: "Annulée",
    expired: "Expirée",
  };

  return (
    <Badge variant={statusColors[status] || "secondary"}>
      {statusText[status] || status}
    </Badge>
  );
};

export const CustomerSubscriptionsTable = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          products (
            name,
            category,
            coverages
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscriptions:", error);
        toast.error("Erreur lors du chargement des polices");
      } else {
        setSubscriptions(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || sub.products?.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      sub.policy_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.products?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailsOpen(true);
  };

  const handleDownloadCertificate = (subscription: Subscription) => {
    toast.success("Téléchargement de l'attestation...");
    // Implement PDF generation
  };

  const handleContactBroker = async (subscription: Subscription) => {
    if (subscription.assigned_broker_id) {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', subscription.assigned_broker_id)
        .single();
      
      if (data?.email) {
        toast.info(`Contact courtier: ${data.email}`);
      } else {
        toast.info("Informations courtier non disponibles");
      }
    } else {
      toast.info("Aucun courtier assigné");
    }
  };

  // Calculate metrics
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const totalAnnualPremium = activeSubscriptions.reduce((sum, s) => sum + (parseFloat(s.monthly_premium.toString()) * 12), 0);
  const annualSavings = activeSubscriptions.length > 1 ? Math.round(totalAnnualPremium * 0.10) : 0;
  
  const nextDueDate = activeSubscriptions.length > 0 
    ? activeSubscriptions.reduce((earliest, sub) => {
        const subDate = new Date(sub.end_date);
        return !earliest || subDate < earliest ? subDate : earliest;
      }, null as Date | null)
    : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Polices actives</CardDescription>
            <CardTitle className="text-3xl">{activeSubscriptions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Prime annuelle totale</CardDescription>
            <CardTitle className="text-3xl">{totalAnnualPremium.toLocaleString('fr-FR')} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Économies annuelles</CardDescription>
            <CardTitle className="text-3xl text-bright-green">
              {annualSavings > 0 ? `${annualSavings.toLocaleString('fr-FR')} FCFA` : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Prochaine échéance</CardDescription>
            <CardTitle className="text-2xl">
              {nextDueDate ? format(nextDueDate, "dd MMM yyyy", { locale: fr }) : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro de police ou produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expirée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="Auto">Auto</SelectItem>
              <SelectItem value="Habitation">Habitation</SelectItem>
              <SelectItem value="Santé">Santé</SelectItem>
              <SelectItem value="Professionnelle">Professionnelle</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('cards')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table or Cards View */}
      {viewMode === 'table' ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>N° Police</TableHead>
                <TableHead>Prime mensuelle</TableHead>
                <TableHead>Prime annuelle</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                    Aucune police trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {getCategoryIcon(sub.products?.category || '')}
                        </div>
                        <div>
                          <div className="font-medium">{sub.products?.name || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">{sub.products?.category || "N/A"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{sub.policy_number}</TableCell>
                    <TableCell className="font-semibold">{parseFloat(sub.monthly_premium.toString()).toLocaleString('fr-FR')} FCFA</TableCell>
                    <TableCell className="text-muted-foreground">{(parseFloat(sub.monthly_premium.toString()) * 12).toLocaleString('fr-FR')} FCFA</TableCell>
                    <TableCell>
                      {format(new Date(sub.end_date), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status, sub.end_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(sub)}>
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadCertificate(sub)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        {sub.assigned_broker_id && (
                          <Button variant="ghost" size="sm" onClick={() => handleContactBroker(sub)}>
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => (
            <Card key={sub.id} className="hover:shadow-medium transition-base">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getCategoryIcon(sub.products?.category || '')}
                    </div>
                    <div>
                      <CardTitle className="text-base">{sub.products?.name || "N/A"}</CardTitle>
                      <CardDescription className="text-xs">{sub.products?.category}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(sub.status, sub.end_date)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">N° Police</span>
                    <span className="font-mono font-medium">{sub.policy_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prime mensuelle</span>
                    <span className="font-semibold">{parseFloat(sub.monthly_premium.toString()).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Échéance</span>
                    <span className="font-medium">{format(new Date(sub.end_date), "dd MMM yyyy", { locale: fr })}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDetails(sub)}>
                    <FileText className="w-3 h-3 mr-1" />
                    Détails
                  </Button>
                  {sub.status === 'active' && (
                    <Button size="sm" className="flex-1">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Payer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {getCategoryIcon(selectedSubscription?.products?.category || '')}
              </div>
              {selectedSubscription?.products?.name}
            </DialogTitle>
            <DialogDescription>
              Police #{selectedSubscription?.policy_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Statut</p>
                  {getStatusBadge(selectedSubscription.status, selectedSubscription.end_date)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Catégorie</p>
                  <p className="font-medium">{selectedSubscription.products?.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date de début</p>
                  <p className="font-medium">
                    {format(new Date(selectedSubscription.start_date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date d'échéance</p>
                  <p className="font-medium">
                    {format(new Date(selectedSubscription.end_date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prime mensuelle</p>
                  <p className="text-lg font-bold">
                    {parseFloat(selectedSubscription.monthly_premium.toString()).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prime annuelle</p>
                  <p className="text-lg font-bold">
                    {(parseFloat(selectedSubscription.monthly_premium.toString()) * 12).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              </div>

              {selectedSubscription.payment_method && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mode de paiement</p>
                  <p className="font-medium">{selectedSubscription.payment_method}</p>
                </div>
              )}

              {selectedSubscription.products?.coverages && (
                <div>
                  <h4 className="font-semibold mb-3">Garanties incluses</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedSubscription.products.coverages).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <Shield className="w-4 h-4 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{value.name || key}</p>
                          {value.limit && (
                            <p className="text-xs text-muted-foreground">
                              Plafond: {value.limit.toLocaleString('fr-FR')} FCFA
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubscription.assigned_broker_id && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Courtier assigné
                  </h4>
                  <p className="text-sm text-muted-foreground">Cliquez sur "Contacter mon courtier" pour plus d'informations</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1" onClick={() => handleDownloadCertificate(selectedSubscription)}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger l'attestation
                </Button>
                {selectedSubscription.assigned_broker_id && (
                  <Button variant="outline" className="flex-1" onClick={() => handleContactBroker(selectedSubscription)}>
                    <Phone className="w-4 h-4 mr-2" />
                    Contacter mon courtier
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
