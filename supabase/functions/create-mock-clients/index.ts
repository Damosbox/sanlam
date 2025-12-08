import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Récupérer le brokerId depuis le body de la requête
    const { brokerId } = await req.json().catch(() => ({}));

    if (!brokerId) {
      throw new Error('brokerId est requis');
    }

    console.log('Broker ID reçu:', brokerId);

    // Vérifier que le broker existe
    const { data: brokerProfile, error: brokerError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name')
      .eq('id', brokerId)
      .single();

    if (brokerError || !brokerProfile) {
      console.error('Erreur récupération broker:', brokerError);
      throw new Error('Broker non trouvé');
    }

    console.log('Broker trouvé:', brokerProfile.display_name);

    // Récupérer les produits
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, base_premium, category')
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
    ];

    const results = [];

    for (let i = 0; i < mockClients.length; i++) {
      const client = mockClients[i];
      
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === client.email);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        console.log(`Utilisateur ${client.email} existe déjà, mise à jour...`);
      } else {
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

        userId = userData.user.id;

        // Attribuer le rôle customer
        await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id: userId, role: 'customer' }, { onConflict: 'user_id' });

        // Mettre à jour le profil
        await supabaseAdmin
          .from('profiles')
          .update({
            display_name: client.displayName,
            phone: client.phone,
          })
          .eq('id', userId);
      }

      // Lier le client au broker
      await supabaseAdmin
        .from('broker_clients')
        .upsert({
          broker_id: brokerId,
          client_id: userId,
          assigned_by: brokerId,
        }, { onConflict: 'broker_id,client_id' });

      // Créer une souscription
      const product = products[i % products.length];
      const policyNumber = `POL-2024-${String(i + 1).padStart(3, '0')}`;
      const monthlyPremium = product.base_premium * (1 + (Math.random() * 0.2 - 0.1));

      // Vérifier si la police existe déjà
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('policy_number', policyNumber)
        .single();

      if (!existingSub) {
        await supabaseAdmin
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
          });
      }

      // Créer 2-3 sinistres par client
      const claimsToCreate = 2 + (i % 2);
      const claimTypes: Array<'Auto' | 'Santé' | 'Habitation'> = ['Auto', 'Santé', 'Habitation'];
      const claimStatuses: Array<'Submitted' | 'Reviewed' | 'Approved'> = ['Submitted', 'Reviewed', 'Approved'];
      const locations = ['Abidjan, Cocody', 'Yamoussoukro', 'Abidjan, Plateau', 'Bouaké', 'San-Pédro'];
      const descriptions = {
        'Auto': [
          'Collision avec un autre véhicule sur l\'autoroute',
          'Dégâts causés par la grêle sur le parking',
          'Vol de rétroviseurs et accessoires',
          'Accident de stationnement au supermarché',
        ],
        'Santé': [
          'Hospitalisation suite à une intervention chirurgicale',
          'Frais de consultation et analyses médicales',
          'Soins dentaires urgents',
          'Frais d\'optique - lunettes correctrices',
        ],
        'Habitation': [
          'Dégât des eaux - fuite canalisation',
          'Cambriolage avec effraction',
          'Incendie partiel dans la cuisine',
          'Dommages causés par la tempête',
        ],
      };

      for (let j = 0; j < claimsToCreate; j++) {
        const claimType = claimTypes[(i + j) % claimTypes.length];
        const claimStatus = claimStatuses[j % claimStatuses.length];
        const descList = descriptions[claimType];
        
        await supabaseAdmin
          .from('claims')
          .insert({
            user_id: userId,
            claim_type: claimType,
            policy_id: policyNumber,
            status: claimStatus,
            incident_date: new Date(2024, 8 + (j % 4), 5 + j * 7).toISOString(),
            location: locations[(i + j) % locations.length],
            description: descList[j % descList.length],
            cost_estimation: Math.round(50000 + Math.random() * 500000),
            ai_confidence: 0.75 + Math.random() * 0.2,
            assigned_broker_id: brokerId,
            damages: claimType === 'Auto' 
              ? [{ type: 'collision', zone: 'Avant', severity: 1 + (j % 3) }]
              : claimType === 'Habitation'
              ? [{ type: 'dégât des eaux', zone: 'Salle de bain', severity: 2 }]
              : [],
          });
      }

      results.push({
        email: client.email,
        success: true,
        userId,
        policyNumber,
        claimsCreated: claimsToCreate,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.filter(r => r.success).length} clients créés avec ${results.reduce((acc, r) => acc + (r.claimsCreated || 0), 0)} sinistres`,
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
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
