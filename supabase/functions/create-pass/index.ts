// Edge Function: create-pass
// Creates a new travel pass for an authenticated user
// Calls RailPassSubscription.sol issuePass function

import { createSupabaseClient, getAuthenticatedUser, corsHeaders } from '../_shared/supabase.ts';
import { getRailPassSubscriptionContract, waitForTransaction } from '../_shared/blockchain.ts';

/**
 * Convert pass type string to contract enum value
 * 0 = daily, 1 = weekly, 2 = monthly
 */
function getPassTypeEnum(passType: string): number {
  const passTypeMap: Record<string, number> = {
    'daily': 0,
    'weekly': 1,
    'monthly': 2,
  };
  
  const enumValue = passTypeMap[passType.toLowerCase()];
  if (enumValue === undefined) {
    throw new Error(`Invalid pass type: ${passType}. Must be 'daily', 'weekly', or 'monthly'`);
  }
  
  return enumValue;
}

/**
 * Calculate duration in seconds based on pass type
 */
function getPassDurationSeconds(passType: string): number {
  const now = Math.floor(Date.now() / 1000);
  const oneDay = 24 * 60 * 60;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay; // Approximate month as 30 days
  
  switch (passType.toLowerCase()) {
    case 'daily':
      return oneDay;
    case 'weekly':
      return oneWeek;
    case 'monthly':
      return oneMonth;
    default:
      throw new Error(`Invalid pass type: ${passType}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
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

    // Parse request body
    const { pass_type } = await req.json();

    // Validate required fields
    if (!pass_type) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required field: pass_type',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate pass_type
    if (!['daily', 'weekly', 'monthly'].includes(pass_type.toLowerCase())) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid pass_type. Must be "daily", "weekly", or "monthly"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createSupabaseClient(req);

    // Get user profile with wallet address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nin_verified, wallet_address')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User profile not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!profile.nin_verified) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'NIN verification required. Please verify your NIN before purchasing passes.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!profile.wallet_address) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Wallet address not found. Please connect your wallet.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get RailPassSubscription contract
    const passContract = getRailPassSubscriptionContract();

    // Get next pass ID before issuing
    const nextPassId = await passContract.nextPassId();

    // Calculate duration and expiration
    const durationSeconds = getPassDurationSeconds(pass_type);
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + durationSeconds * 1000);

    // Issue pass on blockchain
    let txHash: string;
    try {
      const passTypeEnum = getPassTypeEnum(pass_type);
      const tx = await passContract.issuePass(
        profile.wallet_address,
        passTypeEnum,
        durationSeconds
      );
      
      txHash = tx.hash;
      
      // Wait for transaction confirmation
      await waitForTransaction(txHash, 1);
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to issue pass on blockchain',
          error: blockchainError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get blockchain pass ID
    const blockchainPassId = Number(nextPassId);

    // Create pass record in database
    const { data: pass, error: passError } = await supabase
      .from('passes')
      .insert({
        user_id: userId,
        pass_type: pass_type.toLowerCase(),
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        blockchain_tx_hash: txHash,
        blockchain_pass_id: blockchainPassId,
        status: 'active',
      })
      .select()
      .single();

    if (passError || !pass) {
      console.error('Error creating pass in database:', passError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to create pass record in database',
          error: passError?.message,
          blockchain_tx_hash: txHash,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return created pass
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...pass,
          blockchain_pass_id: blockchainPassId,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-pass function:', error);
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

