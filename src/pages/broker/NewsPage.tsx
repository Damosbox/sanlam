import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BrokerNews {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  priority: number;
  start_date: string;
  created_at: string;
}

export default function NewsPage() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["broker-news-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_news")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BrokerNews[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Newspaper className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Actualités</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dernières nouvelles et annonces
          </p>
        </div>
      </div>

      {/* News List */}
      {news && news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <Card key={item.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(item.start_date || item.created_at), "d MMM yyyy", {
                      locale: fr,
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {item.content}
                </p>
                {item.link_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                      {item.link_label || "En savoir plus"}
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-12 text-center">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aucune actualité pour le moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
