import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MOCK_AGENTS = [
  { email: 'aminata.kone@sanlam.ci', firstName: 'Aminata', lastName: 'Koné', phone: '+225 07 11 22 33 44' },
  { email: 'kouadio.yao@sanlam.ci', firstName: 'Kouadio', lastName: 'Yao', phone: '+225 07 22 33 44 55' },
  { email: 'fatou.diallo@sanlam.ci', firstName: 'Fatou', lastName: 'Diallo', phone: '+225 07 33 44 55 66' },
  { email: 'ibrahim.toure@sanlam.ci', firstName: 'Ibrahim', lastName: 'Touré', phone: '+225 07 44 55 66 77' },
];

const LEAD_NAMES = [
  ['Marie', 'Kouassi'], ['Jean', 'Bamba'], ['Awa', 'Sangaré'], ['Yves', 'Brou'],
  ['Sandra', 'Ouattara'], ['Paul', 'N\'Guessan'], ['Linda', 'Coulibaly'], ['Eric', 'Kouadio'],
  ['Salimata', 'Traoré'], ['Hervé', 'Konaté'], ['Mariam', 'Cissé'], ['David', 'Aka'],
];

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
const PRODUCTS = ['Assurance Auto', 'Pack Obsèques'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Auth + admin check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Non autorisé' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Token invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: roleData } = await supabaseAdmin
      .from('user_roles').select('role')
      .eq('user_id', userData.user.id).eq('role', 'admin').single();
    if (!roleData) {
      return new Response(JSON.stringify({ success: false, error: 'Accès réservé aux administrateurs' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    for (const agent of MOCK_AGENTS) {
      try {
        // Create or fetch existing auth user
        let agentId: string | null = null;
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: agent.email,
          password: 'Test1234!',
          email_confirm: true,
          user_metadata: { first_name: agent.firstName, last_name: agent.lastName, display_name: `${agent.firstName} ${agent.lastName}` }
        });

        if (createErr) {
          // Already exists -> find it
          const { data: list } = await supabaseAdmin.auth.admin.listUsers();
          const existing = list?.users?.find((u: any) => u.email === agent.email);
          if (!existing) throw createErr;
          agentId = existing.id;
        } else {
          agentId = created.user.id;
        }

        await new Promise(r => setTimeout(r, 400));

        // Update profile with phone
        await supabaseAdmin.from('profiles').update({
          phone: agent.phone,
          first_name: agent.firstName,
          last_name: agent.lastName,
          display_name: `${agent.firstName} ${agent.lastName}`,
        }).eq('id', agentId);

        // Ensure broker role
        await supabaseAdmin.from('user_roles').delete().eq('user_id', agentId);
        await supabaseAdmin.from('user_roles').insert({ user_id: agentId, role: 'broker' });

        // Create 5-8 leads for this agent
        const leadCount = randInt(5, 8);
        const leadsToInsert = [];
        for (let i = 0; i < leadCount; i++) {
          const [fn, ln] = rand(LEAD_NAMES);
          leadsToInsert.push({
            first_name: fn,
            last_name: ln,
            email: `${fn.toLowerCase()}.${ln.toLowerCase().replace(/'/g, '')}${randInt(1,999)}@test.ci`,
            phone: `+225 0${randInt(1,9)} ${randInt(10,99)} ${randInt(10,99)} ${randInt(10,99)} ${randInt(10,99)}`,
            status: rand(LEAD_STATUSES),
            product_interest: rand(PRODUCTS),
            source: rand(['website', 'referral', 'phone', 'walk_in']),
            assigned_broker_id: agentId,
          });
        }
        const { data: insertedLeads } = await supabaseAdmin.from('leads').insert(leadsToInsert).select('id, status');

        // Create 2-4 quotations for this agent
        const quoteCount = randInt(2, 4);
        const quotesToInsert = [];
        const wonLeads = (insertedLeads || []).filter((l: any) => ['qualified', 'proposal', 'won'].includes(l.status));
        for (let i = 0; i < quoteCount; i++) {
          const product = rand(PRODUCTS);
          quotesToInsert.push({
            broker_id: agentId,
            lead_id: wonLeads[i % Math.max(1, wonLeads.length)]?.id || null,
            product_type: product === 'Assurance Auto' ? 'auto' : 'obseques',
            product_name: product,
            premium_amount: randInt(50000, 350000),
            premium_frequency: rand(['monthly', 'annual']),
            payment_status: rand(['pending', 'paid', 'pending']),
            valid_until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            is_draft: false,
          });
        }
        await supabaseAdmin.from('quotations').insert(quotesToInsert);

        results.push({
          email: agent.email,
          name: `${agent.firstName} ${agent.lastName}`,
          agentId,
          leadsCreated: leadCount,
          quotesCreated: quoteCount,
          success: true,
        });
      } catch (err: any) {
        console.error(`Erreur ${agent.email}:`, err);
        results.push({ email: agent.email, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return new Response(JSON.stringify({
      success: true,
      message: `${successCount}/${MOCK_AGENTS.length} agents créés avec leurs leads et cotations`,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});