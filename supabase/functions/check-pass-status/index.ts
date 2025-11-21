// Edge Function: check-pass-status
// Checks the status of a pass (both on-chain and off-chain)
// Verifies pass validity using RailPassSubscription.sol isPassValid

import { createSupabaseClient, getAuthenticatedUser, corsHeaders } from '../_shared/supabase.ts';
import { getRailPassSubscriptionContract } from '../_shared/blockchain.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow GET and POST requests
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get authenticated user
    const userId = await getAuthenticatedUser(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request - can be GET with query params or POST with body
    let passId: string | null = null;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      passId = url.searchParams.get('pass_id');
    } else {
      const body = await req.json();
      passId = body.pass_id;
    }

    // Create Supabase client
    const supabase = createSupabaseClient(req);

    // If pass_id is provided, check specific pass
    if (passId) {
      const { data: pass, error: passError } = await supabase
        .from('passes')
        .select('*')
        .eq('id', passId)
        .eq('user_id', userId)
        .single();

      if (passError || !pass) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Pass not found',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check blockchain validity if blockchain_pass_id exists
      let blockchainValid = null;
      if (pass.blockchain_pass_id) {
        try {
          const passContract = getRailPassSubscriptionContract();
          blockchainValid = await passContract.isPassValid(pass.blockchain_pass_id);
        } catch (blockchainError) {
          console.error('Blockchain check error:', blockchainError);
          // Continue with database check even if blockchain check fails
        }
      }

      // Check database validity
      const now = new Date();
      const expiresAt = new Date(pass.expires_at);
      const dbValid = pass.status === 'active' && expiresAt > now;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...pass,
            is_valid: dbValid && (blockchainValid !== false),
            blockchain_valid: blockchainValid,
            db_valid: dbValid,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If no pass_id, return all user's passes
    const { data: passes, error: passesError } = await supabase
      .from('passes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (passesError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to fetch passes',
          error: passesError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check validity for each pass
    const now = new Date();
    const passesWithStatus = await Promise.all(
      (passes || []).map(async (pass) => {
        let blockchainValid = null;
        if (pass.blockchain_pass_id) {
          try {
            const passContract = getRailPassSubscriptionContract();
            blockchainValid = await passContract.isPassValid(pass.blockchain_pass_id);
          } catch (blockchainError) {
            console.error('Blockchain check error:', blockchainError);
          }
        }

        const expiresAt = new Date(pass.expires_at);
        const dbValid = pass.status === 'active' && expiresAt > now;

        return {
          ...pass,
          is_valid: dbValid && (blockchainValid !== false),
          blockchain_valid: blockchainValid,
          db_valid: dbValid,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: passesWithStatus,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in check-pass-status function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

