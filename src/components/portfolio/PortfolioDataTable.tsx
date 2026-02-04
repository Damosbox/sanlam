import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, MessageCircle, Mail, MoreHorizontal, Eye, UserCheck, Clock, Inbox, ShoppingCart, Star } from "lucide-react";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScoreDetailPopover } from "./ScoreDetailPopover";

export interface PortfolioItem {
  id: string;
  type: "prospect" | "client";
  display_name: string;
  first_name?: string;
  last_name?: string;
  email: string | null;
  phone: string | null;
  whatsapp?: string | null;
  status?: string;
  client_status?: "active" | "pending";
  product_interest?: string | null;
  source?: string | null;
  claimsCount?: number;
  subscriptionsCount?: number;
  quotationsCount?: number;
  valueScore?: number; // Score global /100
  valueClass?: number; // Classe 1-5 étoiles
}

interface PortfolioDataTableProps {
  items: PortfolioItem[];
  density?: "compact" | "standard";
  onSelectItem: (item: PortfolioItem) => void;
}

// Simulate value score calculation based on activity
const calculateMockScore = (item: PortfolioItem): { score: number; classe: number } => {
  if (item.type === "prospect") {
    // Prospects get predictive score based on interest
    const baseScore = 40 + Math.random() * 30;
    return { score: Math.round(baseScore), classe: Math.ceil(baseScore / 20) };
  }
  
  // Clients get score based on subscriptions and claims
  const subsScore = Math.min((item.subscriptionsCount || 0) * 15, 40);
  const claimsPenalty = Math.min((item.claimsCount || 0) * 5, 20);
  const baseScore = 50 + subsScore - claimsPenalty + Math.random() * 20;
  const score = Math.min(100, Math.max(10, Math.round(baseScore)));
  return { score, classe: Math.ceil(score / 20) };
};

export const PortfolioDataTable = ({ items, density = "standard", onSelectItem }: PortfolioDataTableProps) => {
  const navigate = useNavigate();

  const handleCall = (e: React.MouseEvent, phone: string | null) => {
    e.stopPropagation();
    if (phone) {
      window.open(`tel:${phone}`, "_blank");
    } else {
      toast.error("Aucun numéro de téléphone disponible");
    }
  };

  const handleWhatsApp = (e: React.MouseEvent, item: PortfolioItem) => {
    e.stopPropagation();
    const number = item.whatsapp || item.phone;
    if (number) {
      const cleanNumber = number.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    } else {
      toast.error("Aucun numéro WhatsApp disponible");
    }
  };

  const handleEmail = (e: React.MouseEvent, email: string | null) => {
    e.stopPropagation();
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      toast.error("Aucune adresse email disponible");
    }
  };

  const rowPadding = density === "compact" ? "py-2" : "py-3";
  const avatarSize = density === "compact" ? "h-8 w-8" : "h-10 w-10";
  const textSize = density === "compact" ? "text-xs" : "text-sm";

  const getInitials = (item: PortfolioItem) => {
    if (item.first_name && item.last_name) {
      return `${item.first_name[0]}${item.last_name[0]}`.toUpperCase();
    }
    if (item.display_name) {
      const parts = item.display_name.split(" ");
      return parts.length > 1 
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : item.display_name.slice(0, 2).toUpperCase();
    }
    return "??";
  };

  const getName = (item: PortfolioItem) => {
    if (item.first_name && item.last_name) {
      return `${item.first_name} ${item.last_name}`;
    }
    return item.display_name || "N/A";
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun élément trouvé
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[200px]">Nom</TableHead>
              <TableHead className="hidden sm:table-cell w-[80px] text-center">Score</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Cotations</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Contrats</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Sinistres</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const mockScore = calculateMockScore(item);
              const itemScore = item.valueScore ?? mockScore.score;
              const itemClass = item.valueClass ?? mockScore.classe;
              
              return (
                <TableRow 
                  key={item.id} 
                  className="hover:bg-muted/30 transition-colors duration-200"
                >
                  <TableCell className={rowPadding}>
                    <div className="flex items-center gap-3">
                      <Avatar className={avatarSize}>
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(item)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <button
                          className={`font-medium ${textSize} text-left hover:text-primary hover:underline transition-colors`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectItem(item);
                          }}
                        >
                          {getName(item)}
                        </button>
                        {item.product_interest && (
                          <p className="text-xs text-muted-foreground">{item.product_interest}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Score Column - Clickable for details */}
                  <TableCell className={`hidden sm:table-cell ${rowPadding} text-center`}>
                    <ScoreDetailPopover
                      score={itemScore}
                      classe={itemClass}
                      clientId={item.id}
                      clientType={item.type}
                    >
                      <button className="inline-flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3",
                                i < itemClass 
                                  ? "text-amber-500 fill-amber-500" 
                                  : "text-muted-foreground/20"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {itemScore}/100
                        </span>
                      </button>
                    </ScoreDetailPopover>
                  </TableCell>
                  
                  {/* Contact Column */}
                  <TableCell className={`${rowPadding} ${textSize}`}>
                    <div className="space-y-0.5">
                      <p>{item.phone || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">{item.email || ""}</p>
                    </div>
                  </TableCell>
                  
                  {/* Type Column */}
                  <TableCell className={`hidden md:table-cell ${rowPadding}`}>
                    {item.type === "prospect" ? (
                      <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                        <Inbox className="h-3 w-3" />
                        Prospect
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                        <UserCheck className="h-3 w-3" />
                        Client
                      </Badge>
                    )}
                  </TableCell>
                  
                  {/* Quotations Column */}
                  <TableCell className={`hidden lg:table-cell ${rowPadding} text-center`}>
                    <Badge variant="outline" className="text-xs">
                      {item.quotationsCount || 0}
                    </Badge>
                  </TableCell>
                  
                  {/* Contracts Column */}
                  <TableCell className={`hidden lg:table-cell ${rowPadding} text-center`}>
                    {item.type === "client" ? (
                      <button
                        className="text-primary hover:underline font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/b2b/policies?clientId=${item.id}`);
                        }}
                      >
                        <Badge variant="default" className="text-xs cursor-pointer hover:bg-primary/80">
                          {item.subscriptionsCount || 0}
                        </Badge>
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  
                  {/* Claims Column */}
                  <TableCell className={`hidden lg:table-cell ${rowPadding} text-center`}>
                    {item.type === "client" ? (
                      <button
                        className="text-primary hover:underline font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/b2b/claims?clientId=${item.id}`);
                        }}
                      >
                        <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                          {item.claimsCount || 0}
                        </Badge>
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  
                  {/* Status Column */}
                  <TableCell className={rowPadding}>
                    {item.type === "prospect" && item.status ? (
                      <LeadStatusBadge status={item.status as any} />
                    ) : item.client_status === "active" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1">
                        <UserCheck className="h-3 w-3" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        En attente
                      </Badge>
                    )}
                  </TableCell>
                  
                  {/* Actions Column */}
                  <TableCell className={`${rowPadding} text-right`}>
                    <div className="flex items-center justify-end gap-1">
                      {item.type === "prospect" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/b2b/sales?contactId=${item.id}&type=prospect`);
                          }}
                          title="Vente guidée"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleCall(e, item.phone)}
                        disabled={!item.phone}
                        title="Appeler"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={(e) => handleWhatsApp(e, item)}
                        disabled={!item.whatsapp && !item.phone}
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleEmail(e as any, item.email)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Envoyer un email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSelectItem(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
  );
};
