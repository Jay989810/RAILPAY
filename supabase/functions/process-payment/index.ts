// Edge Function: process-payment
// Processes payment for tickets or passes
// Calls RailPayPayments.sol payForTicket or payForPass
// msg.value is optional (can be 0 for off-chain payments)

import { createSupabaseClient, getAuthenticatedUser, corsHeaders } from '../_shared/supabase.ts';
import { getRailPayPaymentsContract, parseUnits, waitForTransaction } from '../_shared/blockchain.ts';
import { ethers } from 'https://esm.sh/ethers@6.9.0';

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
    const { ticket_id, pass_type, amount, currency, payment_method, msg_value } = await req.json();

    // Validate required fields
    if (!amount) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required field: amount',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Must have either ticket_id or pass_type, but not both
    if (!ticket_id && !pass_type) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Must provide either ticket_id or pass_type',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (ticket_id && pass_type) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Cannot provide both ticket_id and pass_type',
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
      .select('wallet_address')
      .eq('id', userId)
      .single();

    if (profileError || !profile || !profile.wallet_address) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User wallet address not found',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get RailPayPayments contract
    const paymentsContract = getRailPayPaymentsContract();

    // Convert amount to wei (assuming amount is in ETH)
    const amountInWei = parseUnits(amount.toString(), 18);

    // Generate reference hash (unique identifier for this payment)
    const reference = ethers.keccak256(
      ethers.toUtf8Bytes(`${userId}-${Date.now()}-${ticket_id || pass_type}`)
    );

    let txHash: string;
    let receiptId: bigint | null = null;

    try {
      // Process payment on blockchain
      if (ticket_id) {
        // Payment for ticket
        // Convert ticket_id UUID to uint256 (use first 16 bytes)
        const ticketIdBigInt = BigInt('0x' + ticket_id.replace(/-/g, '').substring(0, 32));
        
        // Get msg.value (optional, defaults to 0)
        const msgValue = msg_value ? parseUnits(msg_value.toString(), 18) : 0n;
        
        const tx = await paymentsContract.payForTicket(
          ticketIdBigInt,
          reference,
          amountInWei,
          { value: msgValue }
        );
        
        txHash = tx.hash;
      } else {
        // Payment for pass
        // Convert pass_type to enum (0=daily, 1=weekly, 2=monthly)
        const passTypeMap: Record<string, number> = {
          'daily': 0,
          'weekly': 1,
          'monthly': 2,
        };
        const passTypeEnum = passTypeMap[pass_type.toLowerCase()];
        
        if (passTypeEnum === undefined) {
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
        
        // Get msg.value (optional, defaults to 0)
        const msgValue = msg_value ? parseUnits(msg_value.toString(), 18) : 0n;
        
        const tx = await paymentsContract.payForPass(
          passTypeEnum,
          reference,
          amountInWei,
          { value: msgValue }
        );
        
        txHash = tx.hash;
      }

      // Wait for transaction confirmation
      const receipt = await waitForTransaction(txHash, 1);
      
      // Extract receipt ID from events (if available)
      // Note: This is a simplified approach. In production, you might want to parse events more carefully
      const receiptContract = await import('../_shared/blockchain.ts').then(m => m.getRailPayReceiptContract());
      const nextReceiptId = await receiptContract.nextReceiptId();
      receiptId = nextReceiptId - 1n; // The receipt ID should be the one just issued
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to process payment on blockchain',
          error: blockchainError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        ticket_id: ticket_id || null,
        pass_id: null, // Would need to fetch pass_id if pass_type was provided
        amount: amount,
        currency: currency || 'ETH',
        payment_method: payment_method || 'blockchain',
        status: 'completed',
        blockchain_tx_hash: txHash,
        blockchain_receipt_id: receiptId ? Number(receiptId) : null,
        metadata: {
          reference: reference,
          msg_value: msg_value || 0,
        },
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Error creating payment record:', paymentError);
      // Payment was processed on blockchain but DB insert failed
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment processed on blockchain but failed to create database record',
          error: paymentError?.message,
          blockchain_tx_hash: txHash,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return payment record
    return new Response(
      JSON.stringify({
        success: true,
        data: payment,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-payment function:', error);
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

