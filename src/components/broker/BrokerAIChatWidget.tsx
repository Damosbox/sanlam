import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Lightbulb, MessageSquare, TrendingUp, HelpCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type QuickAction = "arguments" | "objections" | "competition" | "help";

const quickActions: { key: QuickAction; label: string; icon: React.ReactNode; description: string }[] = [
  { key: "arguments", label: "Arguments", icon: <Lightbulb className="h-4 w-4" />, description: "Arguments de vente clés" },
  { key: "objections", label: "Objections", icon: <MessageSquare className="h-4 w-4" />, description: "Traiter les objections" },
  { key: "competition", label: "Concurrence", icon: <TrendingUp className="h-4 w-4" />, description: "Positionnement vs concurrents" },
  { key: "help", label: "Aide produit", icon: <HelpCircle className="h-4 w-4" />, description: "Information sur les produits" },
];

const getPageContext = (pathname: string): string => {
  if (pathname.includes("/portfolio")) return "gestion du portefeuille clients";
  if (pathname.includes("/leads")) return "gestion des leads et prospects";
  if (pathname.includes("/guided-sales")) return "vente guidée et souscription";
  if (pathname.includes("/claims")) return "gestion des sinistres";
  if (pathname.includes("/messages")) return "messagerie et communication";
  if (pathname.includes("/analysis")) return "analyse et reporting";
  if (pathname.includes("/policies")) return "gestion des polices";
  return "tableau de bord commercial";
};

export function BrokerAIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const pageContext = getPageContext(location.pathname);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const callAI = async (prompt: string, mode: string = "topic") => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sales-assistant", {
        body: {
          mode,
          topicDescription: prompt,
          productType: "auto",
          productName: "Assurance Sanlam",
          premium: 0,
          planTier: "standard",
          clientName: "le client",
          pageContext,
        },
      });

      if (error) throw error;
      addMessage("assistant", data.response);
    } catch (err) {
      console.error("AI Error:", err);
      addMessage("assistant", "Désolé, une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    const prompts: Record<QuickAction, string> = {
      arguments: `Donne-moi les meilleurs arguments de vente pour convaincre un client dans le contexte de ${pageContext}`,
      objections: `Quelles sont les objections courantes des clients et comment y répondre dans le contexte de ${pageContext}?`,
      competition: `Comment me positionner face à la concurrence pour ${pageContext}?`,
      help: `Explique-moi les produits et services disponibles pour ${pageContext}`,
    };

    addMessage("user", prompts[action]);
    await callAI(prompts[action], "topic");
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    addMessage("user", userMessage);
    await callAI(userMessage, "topic");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-all duration-300 hover:scale-110",
            !isOpen && "animate-pulse"
          )}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-left">Assistant Commercial IA</SheetTitle>
              <p className="text-xs text-muted-foreground text-left">
                Contexte: {pageContext}
              </p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-4">
                Comment puis-je vous aider aujourd'hui ?
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.key}
                    variant="outline"
                    className="h-auto flex-col items-start p-3 text-left"
                    onClick={() => handleQuickAction(action.key)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {action.icon}
                      <span className="font-medium text-sm">{action.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{action.description}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[85%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Réflexion en cours...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {messages.length > 0 && (
          <div className="px-4 py-2 border-t">
            <div className="flex flex-wrap gap-1">
              {quickActions.map((action) => (
                <Button
                  key={action.key}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => handleQuickAction(action.key)}
                  disabled={isLoading}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              placeholder="Posez votre question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
