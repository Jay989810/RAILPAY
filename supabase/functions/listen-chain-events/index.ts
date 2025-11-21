// Edge Function: listen-chain-events
// Reads Sepolia contract events and updates the database
// This function should be called periodically (e.g., via cron job) to sync blockchain events with the database

import { createSupabaseClient, corsHeaders } from '../_shared/supabase.ts';
import {
  getRailPayTicketContractReadOnly,
  getRailPassSubscriptionContractReadOnly,
  getRailPayPaymentsContractReadOnly,
  getProvider,
} from '../_shared/blockchain.ts';

/**
 * Processes TicketMinted events and updates database
 */
async function processTicketMintedEvents(
  supabase: any,
  contract: any,
  fromBlock: number,
  toBlock: number
): Promise<number> {
  try {
    // Get TicketMinted events
    const filter = contract.filters.TicketMinted();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    let processedCount = 0;

    for (const event of events) {
      const tokenId = Number(event.args.tokenId);
      const to = event.args.to;
      const routeId = event.args.routeId;
      const price = event.args.price;

      // Check if ticket already exists in database
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('id')
        .eq('blockchain_token_id', tokenId)
        .single();

      if (!existingTicket) {
        // Try to find ticket by wallet address and route
        // This is a best-effort match since we don't have the exact ticket_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', to.toLowerCase())
          .single();

        if (profile) {
          // Update or create ticket record
          // Note: This is a simplified approach. In production, you might want to
          // store a mapping of blockchain_token_id to ticket_id when minting
          await supabase
            .from('tickets')
            .upsert({
              blockchain_token_id: tokenId,
              blockchain_tx_hash: event.transactionHash,
              user_id: profile.id,
              // Note: route_id would need to be mapped from blockchain routeId
              // For now, we'll leave it null and it can be updated later
            }, {
              onConflict: 'blockchain_token_id',
            });

          processedCount++;
        }
      }
    }

    return processedCount;
  } catch (error) {
    console.error('Error processing TicketMinted events:', error);
    return 0;
  }
}

/**
 * Processes TicketValidated events and updates database
 */
async function processTicketValidatedEvents(
  supabase: any,
  contract: any,
  fromBlock: number,
  toBlock: number
): Promise<number> {
  try {
    // Get TicketValidated events
    const filter = contract.filters.TicketValidated();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    let processedCount = 0;

    for (const event of events) {
      const tokenId = Number(event.args.tokenId);

      // Update ticket status in database
      const { data: ticket } = await supabase
        .from('tickets')
        .select('id, status')
        .eq('blockchain_token_id', tokenId)
        .single();

      if (ticket && ticket.status !== 'used') {
        await supabase
          .from('tickets')
          .update({
            status: 'used',
            validated_at: new Date().toISOString(),
          })
          .eq('blockchain_token_id', tokenId);

        processedCount++;
      }
    }

    return processedCount;
  } catch (error) {
    console.error('Error processing TicketValidated events:', error);
    return 0;
  }
}

/**
 * Processes PassIssued events and updates database
 */
async function processPassIssuedEvents(
  supabase: any,
  contract: any,
  fromBlock: number,
  toBlock: number
): Promise<number> {
  try {
    // Get PassIssued events
    const filter = contract.filters.PassIssued();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    let processedCount = 0;

    for (const event of events) {
      const passId = Number(event.args.passId);
      const owner = event.args.owner;
      const passType = Number(event.args.passType);
      const expiresAt = new Date(Number(event.args.expiresAt) * 1000);

      // Check if pass already exists in database
      const { data: existingPass } = await supabase
        .from('passes')
        .select('id')
        .eq('blockchain_pass_id', passId)
        .single();

      if (!existingPass) {
        // Find user by wallet address
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', owner.toLowerCase())
          .single();

        if (profile) {
          // Map pass type enum to string
          const passTypeMap: Record<number, string> = {
            0: 'daily',
            1: 'weekly',
            2: 'monthly',
          };

          const passTypeString = passTypeMap[passType] || 'daily';
          const startsAt = new Date();

          // Create pass record
          await supabase
            .from('passes')
            .insert({
              user_id: profile.id,
              pass_type: passTypeString,
              starts_at: startsAt.toISOString(),
              expires_at: expiresAt.toISOString(),
              blockchain_tx_hash: event.transactionHash,
              blockchain_pass_id: passId,
              status: 'active',
            });

          processedCount++;
        }
      }
    }

    return processedCount;
  } catch (error) {
    console.error('Error processing PassIssued events:', error);
    return 0;
  }
}

/**
 * Processes PaymentMade events and updates database
 */
async function processPaymentMadeEvents(
  supabase: any,
  contract: any,
  fromBlock: number,
  toBlock: number
): Promise<number> {
  try {
    // Get PaymentMade events
    const filter = contract.filters.PaymentMade();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    let processedCount = 0;

    for (const event of events) {
      const payer = event.args.payer;
      const amount = event.args.amount;
      const ticketId = Number(event.args.ticketId);
      const receiptId = Number(event.args.receiptId);

      // Find user by wallet address
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', payer.toLowerCase())
        .single();

      if (profile) {
        // Find ticket by blockchain_token_id
        const { data: ticket } = await supabase
          .from('tickets')
          .select('id')
          .eq('blockchain_token_id', ticketId)
          .single();

        // Check if payment already exists
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('blockchain_receipt_id', receiptId)
          .single();

        if (!existingPayment) {
          // Create payment record
          await supabase
            .from('payments')
            .insert({
              user_id: profile.id,
              ticket_id: ticket?.id || null,
              amount: Number(amount) / 1e18, // Convert from wei to ETH
              currency: 'ETH',
              payment_method: 'blockchain',
              status: 'completed',
              blockchain_tx_hash: event.transactionHash,
              blockchain_receipt_id: receiptId,
              metadata: {
                payer: payer,
                ticket_id: ticketId,
              },
            });

          processedCount++;
        }
      }
    }

    return processedCount;
  } catch (error) {
    console.error('Error processing PaymentMade events:', error);
    return 0;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests (can be called via cron job)
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createSupabaseClient(req);

    // Get block range from query params or use defaults
    const url = new URL(req.url);
    const fromBlockParam = url.searchParams.get('from_block');
    const toBlockParam = url.searchParams.get('to_block');
    const blocksToScan = parseInt(url.searchParams.get('blocks') || '1000');

    const provider = getProvider();
    const currentBlock = await provider.getBlockNumber();

    // Calculate block range
    const toBlock = toBlockParam ? parseInt(toBlockParam) : currentBlock;
    const fromBlock = fromBlockParam
      ? parseInt(fromBlockParam)
      : Math.max(0, toBlock - blocksToScan);

    // Get contract instances
    const ticketContract = getRailPayTicketContractReadOnly();
    const passContract = getRailPassSubscriptionContractReadOnly();
    const paymentsContract = getRailPayPaymentsContractReadOnly();

    // Process events from all contracts
    const results = {
      ticketMinted: 0,
      ticketValidated: 0,
      passIssued: 0,
      paymentMade: 0,
    };

    results.ticketMinted = await processTicketMintedEvents(
      supabase,
      ticketContract,
      fromBlock,
      toBlock
    );

    results.ticketValidated = await processTicketValidatedEvents(
      supabase,
      ticketContract,
      fromBlock,
      toBlock
    );

    results.passIssued = await processPassIssuedEvents(
      supabase,
      passContract,
      fromBlock,
      toBlock
    );

    results.paymentMade = await processPaymentMadeEvents(
      supabase,
      paymentsContract,
      fromBlock,
      toBlock
    );

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Events processed successfully',
        data: {
          block_range: {
            from: fromBlock,
            to: toBlock,
            current: currentBlock,
          },
          events_processed: results,
          total_processed:
            results.ticketMinted +
            results.ticketValidated +
            results.passIssued +
            results.paymentMade,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in listen-chain-events function:', error);
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

