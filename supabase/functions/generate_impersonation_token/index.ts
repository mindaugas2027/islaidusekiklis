/// <reference lib="deno.ns" />

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-ignore
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[generate_impersonation_token] Server configuration error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { user_id }: { user_id: string } = await req.json();

    if (!user_id) {
      console.warn("[generate_impersonation_token] Bad request: User ID is required.");
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate a sign-in link (token type) for the target user
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'token',
      email: '', // Email is required but not used for token type, can be empty or a placeholder
      user_id: user_id,
    });

    if (error) {
      console.error("[generate_impersonation_token] Error generating impersonation token:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!data?.properties?.access_token) {
      console.error("[generate_impersonation_token] No access token found in generated link data.");
      return new Response(JSON.stringify({ error: 'Failed to generate access token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[generate_impersonation_token] Successfully generated token for user: ${user_id}`);
    return new Response(JSON.stringify({ access_token: data.properties.access_token }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("[generate_impersonation_token] Unexpected error:", error);
    return new Response(JSON.stringify({ error: 'Unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});