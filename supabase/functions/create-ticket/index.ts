// Edge Function: create-ticket
// Creates a new ticket for an authenticated user
// Requires NIN verification before ticket creation
// Calls RailPayTicket.sol mintTicket function

import { createSupabaseClient, getAuthenticatedUser, corsHeaders } from '../_shared/supabase.ts';
import { getRailPayTicketContract, parseUnits, waitForTransaction } from '../_shared/blockchain.ts';

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
    const { route_id, seat_number, ticket_type, travel_date } = await req.json();

    // Validate required fields
    if (!route_id || !ticket_type) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: route_id, ticket_type',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate ticket_type
    if (ticket_type !== 'single' && ticket_type !== 'return') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid ticket_type. Must be "single" or "return"',
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
          message: 'NIN verification required. Please verify your NIN before purchasing tickets.',
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

    // Verify that the route exists and is active
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('id, base_price, active')
      .eq('id', route_id)
      .single();

    if (routeError || !route) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Route not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!route.active) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Route is not active',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate travel time (use travel_date or default to now + 1 hour)
    const travelTime = travel_date 
      ? Math.floor(new Date(travel_date).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 3600; // Default: 1 hour from now

    // Convert price to wei (assuming base_price is in ETH)
    const priceInWei = parseUnits(route.base_price.toString(), 18);

    // Convert route_id UUID to uint256 (use first 16 bytes of UUID)
    const routeIdBigInt = BigInt('0x' + route_id.replace(/-/g, '').substring(0, 32));

    // Get RailPayTicket contract
    const ticketContract = getRailPayTicketContract();

    // Get next ticket ID before minting
    const nextTicketId = await ticketContract.nextTicketId();

    // Mint ticket on blockchain
    let txHash: string;
    try {
      const tx = await ticketContract.mintTicket(
        profile.wallet_address,
        routeIdBigInt,
        priceInWei,
        travelTime,
        seat_number || ''
      );
      
      txHash = tx.hash;
      
      // Wait for transaction confirmation
      await waitForTransaction(txHash, 1);
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to mint ticket on blockchain',
          error: blockchainError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate ticket ID for database (use blockchain token ID)
    const blockchainTokenId = Number(nextTicketId);
    const ticketId = crypto.randomUUID();

    // Generate QR payload in format: railpay:ticket:<ticket_id>
    const qrPayload = `railpay:ticket:${ticketId}`;

    // Create ticket record in database
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        user_id: userId,
        route_id: route_id,
        seat_number: seat_number || null,
        ticket_type: ticket_type,
        qr_payload: qrPayload,
        status: 'valid',
        blockchain_tx_hash: txHash,
        blockchain_token_id: blockchainTokenId,
        travel_date: travel_date || null,
        purchased_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      console.error('Error creating ticket in database:', ticketError);
      // Note: Ticket was minted on blockchain but DB insert failed
      // In production, you might want to handle this differently
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to create ticket record in database',
          error: ticketError?.message,
          blockchain_tx_hash: txHash,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return created ticket with QR payload
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...ticket,
          qr_payload: qrPayload,
          blockchain_token_id: blockchainTokenId,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-ticket function:', error);
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

