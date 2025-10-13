import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, X, Bot, User, FileText, Shield, Phone, ShoppingCart, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: Action[];
}

interface Action {
  type: 'subscribe' | 'contact_broker' | 'view_policy' | 'view_claim' | 'faq';
  label: string;
  data?: any;
}

const quickActions = [
  { id: 'faq', label: 'FAQ', icon: HelpCircle, prompt: 'Quelles sont les questions fréquentes ?' },
  { id: 'support', label: 'Support', icon: MessageCircle, prompt: 'J\'ai besoin d\'aide du support' },
  { id: 'products', label: 'Mes produits', icon: ShoppingCart, prompt: 'Quels sont mes produits souscrits ?' },
  { id: 'policies', label: 'Mes polices', icon: Shield, prompt: 'Affiche-moi mes polices d\'assurance' },
  { id: 'claims', label: 'Mes sinistres', icon: FileText, prompt: 'Quel est l\'état de mes sinistres ?' },
  { id: 'broker', label: 'Mon agent', icon: Phone, prompt: 'Qui est mon agent assigné ?' },
];

export const OmnichannelChat = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [userContext, setUserContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user context when component mounts
  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);

      // Fetch user's claims
      const { data: claims } = await supabase
        .from('claims')
        .select('*')
        .eq('user_id', user.id);

      // Fetch broker assignment
      const { data: brokerClient } = await supabase
        .from('broker_clients')
        .select('broker_id')
        .eq('client_id', user.id)
        .single();

      let broker = null;
      if (brokerClient) {
        const { data: brokerProfile } = await supabase
          .from('profiles')
          .select('display_name, email, phone')
          .eq('id', brokerClient.broker_id)
          .single();
        broker = brokerProfile;
      }

      setUserContext({
        hasSubscriptions: (subscriptions?.length || 0) > 0,
        subscriptionsCount: subscriptions?.length || 0,
        hasClaims: (claims?.length || 0) > 0,
        claimsCount: claims?.length || 0,
        hasBroker: !!broker,
        broker,
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setShowQuickActions(false);
    setInput(action.prompt);
    setTimeout(() => sendMessage(action.prompt), 100);
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case 'subscribe':
        window.location.href = '/b2c#products';
        toast({ title: "Navigation", description: "Redirection vers nos produits" });
        break;
      case 'contact_broker':
        if (userContext?.broker) {
          toast({
            title: "Votre agent",
            description: `${userContext.broker.display_name} - ${userContext.broker.email}`,
          });
        }
        break;
      case 'view_policy':
        window.location.href = '/b2c#subscriptions';
        break;
      case 'view_claim':
        window.location.href = '/b2c#claims';
        break;
      case 'faq':
        // Could open FAQ section
        break;
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowQuickActions(false);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-omnichannel`;
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userContext: {
            locale: 'fr',
            ...userContext
          }
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Erreur de connexion');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add contextual actions based on conversation
      const actions = generateContextualActions(assistantContent);
      if (actions.length > 0) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { 
            ...updated[updated.length - 1], 
            actions 
          };
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const generateContextualActions = (content: string): Action[] => {
    const actions: Action[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('souscrire') || lowerContent.includes('produit')) {
      actions.push({ type: 'subscribe', label: 'Voir nos produits' });
    }
    if (lowerContent.includes('agent') || lowerContent.includes('courtier') || lowerContent.includes('broker')) {
      if (userContext?.hasBroker) {
        actions.push({ type: 'contact_broker', label: 'Contacter mon agent' });
      }
    }
    if (lowerContent.includes('police') || lowerContent.includes('contrat')) {
      actions.push({ type: 'view_policy', label: 'Mes polices' });
    }
    if (lowerContent.includes('sinistre') || lowerContent.includes('claim')) {
      actions.push({ type: 'view_claim', label: 'Mes sinistres' });
    }

    return actions;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] flex flex-col shadow-xl">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between gradient-activated text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Assistant Allianz</h3>
                <p className="text-xs text-white/80">Support 24/7</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center text-muted-foreground text-sm mt-4">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <p className="font-medium">Bonjour ! Comment puis-je vous aider aujourd'hui ?</p>
                </div>
                
                {showQuickActions && (
                  <div className="space-y-2 mt-6">
                    <p className="text-xs text-muted-foreground text-center mb-3">Suggestions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action) => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action)}
                          className="flex items-center gap-2 justify-start h-auto py-2 px-3"
                        >
                          <action.icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex gap-2 ml-10 flex-wrap">
                    {msg.actions.map((action, actionIdx) => (
                      <Button
                        key={actionIdx}
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(action)}
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                disabled={loading}
              />
              <Button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
