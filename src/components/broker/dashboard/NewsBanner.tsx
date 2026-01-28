import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, ExternalLink, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BrokerNews {
  id: string;
  title: string;
  content: string;
  link_url: string | null;
  link_label: string | null;
}

export function NewsBanner() {
  const navigate = useNavigate();

  const { data: news, isLoading } = useQuery({
    queryKey: ["broker-news-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_news")
        .select("id, title, content, link_url, link_label")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] as BrokerNews | undefined;
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!news) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Newspaper className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate">
              {news.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {news.content}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {news.link_url ? (
              <Button variant="outline" size="sm" asChild className="h-8">
                <a href={news.link_url} target="_blank" rel="noopener noreferrer">
                  {news.link_label || "En savoir plus"}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => navigate("/b2b/news")}
              >
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
