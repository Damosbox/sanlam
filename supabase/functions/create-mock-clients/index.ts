import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Récupérer l'ID du broker
    const { data: brokerData } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'broker')
      .limit(1)
      .single();

    if (!brokerData) {
      throw new Error('Aucun broker trouvé');
    }

    const brokerId = brokerData.user_id;

    // Récupérer les produits
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, base_premium')
      .eq('is_active', true)
      .limit(5);

    if (!products || products.length === 0) {
      throw new Error('Aucun produit trouvé');
    }

    const mockClients = [
      {
        email: 'marie.dupont@test.com',
        password: 'Test1234!',
        displayName: 'Marie Dupont',
        phone: '+225 07 12 34 56 78',
      },
      {
        email: 'jean.kouassi@test.com',
        password: 'Test1234!',
        displayName: 'Jean Kouassi',
        phone: '+225 05 23 45 67 89',
      },
      {
        email: 'fatou.diallo@test.com',
        password: 'Test1234!',
        displayName: 'Fatou Diallo',
        phone: '+225 01 34 56 78 90',
      },
      {
        email: 'ahmed.traore@test.com',
        password: 'Test1234!',
        displayName: 'Ahmed Traoré',
        phone: '+225 07 45 67 89 01',
      },
      {
        email: 'sophie.nguessan@test.com',
        password: 'Test1234!',
        displayName: 'Sophie N\'Guessan',
        phone: '+225 05 56 78 90 12',
      },
    ];

    const results = [];

    for (let i = 0; i < mockClients.length; i++) {
      const client = mockClients[i];
      
      // Créer l'utilisateur
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: client.email,
        password: client.password,
        email_confirm: true,
        user_metadata: {
          display_name: client.displayName,
          phone: client.phone,
        }
      });

      if (userError) {
        console.error(`Erreur création utilisateur ${client.email}:`, userError);
        results.push({ email: client.email, success: false, error: userError.message });
        continue;
      }

      const userId = userData.user.id;

      // Attribuer le rôle customer
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: 'customer' });

      if (roleError) {
        console.error(`Erreur attribution rôle ${client.email}:`, roleError);
      }

      // Mettre à jour le profil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          display_name: client.displayName,
          phone: client.phone,
        })
        .eq('id', userId);

      if (profileError) {
        console.error(`Erreur mise à jour profil ${client.email}:`, profileError);
      }

      // Créer une souscription
      const product = products[i % products.length];
      const policyNumber = `POL-2024-${String(i + 1).padStart(3, '0')}`;
      const monthlyPremium = product.base_premium * (1 + (Math.random() * 0.2 - 0.1));

      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          product_id: product.id,
          policy_number: policyNumber,
          monthly_premium: Math.round(monthlyPremium),
          start_date: new Date(2024, i, 15).toISOString(),
          end_date: new Date(2025, i, 15).toISOString(),
          status: 'active',
          assigned_broker_id: brokerId,
          selected_coverages: {
            responsabilité_civile: true,
            assistance: true,
          }
        })
        .select()
        .single();

      if (subError) {
        console.error(`Erreur création souscription ${client.email}:`, subError);
      }

      // Créer 1-2 sinistres pour certains clients
      const claimsToCreate = i % 2 === 0 ? 2 : 1;
      const claimTypes = ['Auto', 'Santé', 'Habitation'];
      const claimStatuses = ['Submitted', 'Reviewed', 'Approved'];

      for (let j = 0; j < claimsToCreate; j++) {
        const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
        const claimStatus = claimStatuses[Math.floor(Math.random() * claimStatuses.length)];
        
        const { error: claimError } = await supabaseAdmin
          .from('claims')
          .insert({
            user_id: userId,
            claim_type: claimType,
            policy_id: policyNumber,
            status: claimStatus,
            incident_date: new Date(2024, 6 + i, 10 + j * 5).toISOString(),
            location: ['Abidjan, Cocody', 'Yamoussoukro', 'Abidjan, Plateau'][i % 3],
            description: `Sinistre ${claimType} - Client ${client.displayName}`,
            cost_estimation: Math.round(50000 + Math.random() * 800000),
            assigned_broker_id: brokerId,
            damages: claimType === 'Auto' 
              ? [{ type: 'collision', zone: 'Avant', severity: 2 }]
              : [],
          });

        if (claimError) {
          console.error(`Erreur création sinistre ${client.email}:`, claimError);
        }
      }

      results.push({
        email: client.email,
        success: true,
        userId,
        policyNumber,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.filter(r => r.success).length} clients créés avec succès`,
        results,
        brokerId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
