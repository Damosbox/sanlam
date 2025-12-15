import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Fetching broker data for user:', user.id);

    // Fetch broker's leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('assigned_broker_id', user.id);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
    }

    // Fetch broker's claims
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select('*')
      .eq('assigned_broker_id', user.id);

    if (claimsError) {
      console.error('Error fetching claims:', claimsError);
    }

    // Fetch broker's subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*, products(name, category)')
      .eq('assigned_broker_id', user.id);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
    }

    // Fetch broker's clients
    const { data: clients, error: clientsError } = await supabase
      .from('broker_clients')
      .select('*, profiles:client_id(display_name, email)')
      .eq('broker_id', user.id);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    }

    // Calculate metrics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const leadsData = leads || [];
    const claimsData = claims || [];
    const subscriptionsData = subscriptions || [];
    const clientsData = clients || [];

    // Leads analysis
    const newLeads = leadsData.filter(l => l.status === 'nouveau');
    const inactiveLeads = leadsData.filter(l => {
      const lastContact = l.last_contact_at ? new Date(l.last_contact_at) : new Date(l.created_at);
      return lastContact < sevenDaysAgo && l.status !== 'converti' && l.status !== 'perdu';
    });
    const conversionRate = leadsData.length > 0 
      ? (leadsData.filter(l => l.status === 'converti').length / leadsData.length) * 100 
      : 0;

    // Subscriptions analysis
    const activeSubscriptions = subscriptionsData.filter(s => s.status === 'active');
    const expiringSubscriptions = activeSubscriptions.filter(s => {
      const endDate = new Date(s.end_date);
      return endDate > now && endDate < thirtyDaysAgo;
    });
    
    // Product distribution
    const productCounts: Record<string, number> = {};
    const productCategories: Record<string, number> = {};
    activeSubscriptions.forEach(s => {
      const productName = (s.products as any)?.name || 'Inconnu';
      const category = (s.products as any)?.category || 'autre';
      productCounts[productName] = (productCounts[productName] || 0) + 1;
      productCategories[category] = (productCategories[category] || 0) + 1;
    });

    // Clients with single product (cross-sell opportunity)
    const clientProducts: Record<string, Set<string>> = {};
    activeSubscriptions.forEach(s => {
      const category = (s.products as any)?.category || 'autre';
      if (!clientProducts[s.user_id]) {
        clientProducts[s.user_id] = new Set();
      }
      clientProducts[s.user_id].add(category);
    });
    const singleProductClients = Object.entries(clientProducts)
      .filter(([_, categories]) => categories.size === 1)
      .length;

    // Claims analysis
    const pendingClaims = claimsData.filter(c => c.status === 'Submitted' || c.status === 'Draft');
    const recentClaims = claimsData.filter(c => new Date(c.created_at) > thirtyDaysAgo);

    // Build context for AI
    const brokerContext = {
      leads: {
        total: leadsData.length,
        new: newLeads.length,
        inactive: inactiveLeads.length,
        conversionRate: conversionRate.toFixed(1),
        byStatus: {
          nouveau: leadsData.filter(l => l.status === 'nouveau').length,
          en_cours: leadsData.filter(l => l.status === 'en_cours').length,
          relance: leadsData.filter(l => l.status === 'relance').length,
          converti: leadsData.filter(l => l.status === 'converti').length,
          perdu: leadsData.filter(l => l.status === 'perdu').length,
        }
      },
      subscriptions: {
        total: activeSubscriptions.length,
        expiringSoon: expiringSubscriptions.length,
        totalMonthlyPremium: activeSubscriptions.reduce((sum, s) => sum + (s.monthly_premium || 0), 0),
        productDistribution: productCounts,
        categoryDistribution: productCategories,
      },
      clients: {
        total: clientsData.length,
        singleProductClients,
        crossSellOpportunity: singleProductClients,
      },
      claims: {
        total: claimsData.length,
        pending: pendingClaims.length,
        recentMonth: recentClaims.length,
      }
    };

    console.log('Broker context:', JSON.stringify(brokerContext, null, 2));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Tu es un assistant IA spécialisé pour les courtiers en assurance sur le marché africain FCFA.
Ton rôle est de générer 4-6 recommandations actionnables et prioritaires basées sur les données réelles du portefeuille du courtier.

Types de recommandations :
- "upsell" : Clients existants qui pourraient upgrader leur couverture
- "cross_sell" : Clients avec un seul type de produit qui pourraient en acheter d'autres
- "risk" : Alertes sur des leads inactifs, sinistres en attente, ou risques opérationnels
- "opportunity" : Opportunités business (renouvellements proches, nouveaux leads, etc.)

Règles :
- Sois concis et actionnable
- Utilise des chiffres précis tirés des données
- Priorise les recommandations à fort impact
- Adapte le langage au contexte africain/FCFA`;

    const userPrompt = `Analyse les données de ce courtier et génère des recommandations personnalisées :

**LEADS (Prospects) :**
- Total : ${brokerContext.leads.total}
- Nouveaux leads (à contacter) : ${brokerContext.leads.new}
- Leads inactifs (+7 jours sans contact) : ${brokerContext.leads.inactive}
- Taux de conversion : ${brokerContext.leads.conversionRate}%
- Par statut : Nouveau(${brokerContext.leads.byStatus.nouveau}), En cours(${brokerContext.leads.byStatus.en_cours}), Relance(${brokerContext.leads.byStatus.relance}), Converti(${brokerContext.leads.byStatus.converti}), Perdu(${brokerContext.leads.byStatus.perdu})

**POLICES ACTIVES :**
- Total : ${brokerContext.subscriptions.total}
- Expirant dans 30 jours : ${brokerContext.subscriptions.expiringSoon}
- Prime mensuelle totale : ${brokerContext.subscriptions.totalMonthlyPremium.toLocaleString()} FCFA
- Distribution produits : ${JSON.stringify(brokerContext.subscriptions.productDistribution)}
- Distribution catégories : ${JSON.stringify(brokerContext.subscriptions.categoryDistribution)}

**CLIENTS :**
- Total : ${brokerContext.clients.total}
- Clients avec un seul produit (opportunité cross-sell) : ${brokerContext.clients.singleProductClients}

**SINISTRES :**
- Total : ${brokerContext.claims.total}
- En attente de traitement : ${brokerContext.claims.pending}
- Ce mois : ${brokerContext.claims.recentMonth}

Génère 4-6 recommandations prioritaires et actionnables.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "provide_dashboard_recommendations",
            description: "Fournir des recommandations personnalisées pour le tableau de bord du courtier",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  description: "Liste des recommandations (4-6)",
                  items: {
                    type: "object",
                    properties: {
                      type: { 
                        type: "string", 
                        enum: ["upsell", "cross_sell", "risk", "opportunity"],
                        description: "Type de recommandation" 
                      },
                      title: { 
                        type: "string", 
                        description: "Titre court et accrocheur (max 40 caractères)" 
                      },
                      description: { 
                        type: "string", 
                        description: "Description courte avec chiffres précis (max 60 caractères)" 
                      },
                      action: { 
                        type: "string", 
                        description: "Label du bouton d'action (max 15 caractères)" 
                      },
                      priority: {
                        type: "string",
                        enum: ["low", "medium", "high"],
                        description: "Niveau de priorité"
                      },
                      targetPage: {
                        type: "string",
                        enum: ["leads", "clients", "claims", "policies", "sales"],
                        description: "Page cible pour l'action. leads=prospects, clients=portfolio clients, claims=sinistres, policies=polices, sales=vente guidée"
                      }
                    },
                    required: ["type", "title", "description", "action", "priority", "targetPage"],
                    additionalProperties: false
                  }
                }
              },
              required: ["recommendations"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "provide_dashboard_recommendations" } }
    };

    console.log('Calling Lovable AI Gateway...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes dépassée. Veuillez réessayer." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('AI Gateway response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Parsed recommendations:', result);

    // Add unique IDs to recommendations
    const recommendationsWithIds = result.recommendations.map((rec: any, index: number) => ({
      ...rec,
      id: `rec-${Date.now()}-${index}`
    }));

    return new Response(
      JSON.stringify({ recommendations: recommendationsWithIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in broker-dashboard-recommendations:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
