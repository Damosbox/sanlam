import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'broker' | 'customer';
  displayName: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    // Verify caller is authenticated and is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await supabaseAdmin.auth.getUser(token)
    if (claimsError || !claims?.user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', claims.user.id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Accès réservé aux administrateurs' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const testUsers: TestUser[] = [
      {
        email: 'b2btest@box.africa',
        password: '1234$',
        role: 'broker',
        displayName: 'Broker Test'
      },
      {
        email: 'b2ctest@box.africa',
        password: '1234$',
        role: 'customer',
        displayName: 'Customer Test'
      },
      {
        email: 'admintest@box.africa',
        password: '1234$',
        role: 'admin',
        displayName: 'Admin Test'
      }
    ]

    const results = []

    for (const testUser of testUsers) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: testUser.displayName
        }
      })

      if (authError) {
        console.error(`Erreur création ${testUser.email}:`, authError)
        results.push({
          email: testUser.email,
          success: false,
          error: authError.message
        })
        continue
      }

      await new Promise(resolve => setTimeout(resolve, 1000))

      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: testUser.role
        })

      if (roleError) {
        console.error(`Erreur rôle ${testUser.email}:`, roleError)
        results.push({
          email: testUser.email,
          userId: authData.user.id,
          success: false,
          error: roleError.message
        })
      } else {
        results.push({
          email: testUser.email,
          userId: authData.user.id,
          role: testUser.role,
          success: true
        })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
