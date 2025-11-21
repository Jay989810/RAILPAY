// Edge Function: admin-scan-qr
// Staff/admin scans QR code to validate ticket
// Calls RailPayTicket.sol validateTicket function

import { createSupabaseClient, getAuthenticatedUser, corsHeaders } from '../_shared/supabase.ts';
import { getRailPayTicketContract, waitForTransaction } from '../_shared/blockchain.ts';

/**
 * Parses ticket ID from QR payload
 * Expected format: railpay:ticket:<ticket_id>
 */
function parseTicketIdFromQr(qrPayload: string): string | null {
  const prefix = 'railpay:ticket:';
  if (!qrPayload || !qrPayload.startsWith(prefix)) {
    return null;
  }
  return qrPayload.replace(prefix, '');
}

/**
 * Checks if user is admin or staff
 */
async function isAdminOrStaff(supabase: any, userId: string): Promise<boolean> {
  // Check if user is in staff table
  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, role')
    .eq('user_id', userId)
    .eq('active', true)
    .single();

  if (error || !staff) {
    return false;
  }

  // Check if role is admin or staff
  return staff.role === 'admin' || staff.role === 'staff';
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

    // Create Supabase client
    const supabase = createSupabaseClient(req);

    // Check if user is admin or staff
    const isAuthorized = await isAdminOrStaff(supabase, userId);
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unauthorized. Admin or staff access required.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { qr_payload, device_id } = await req.json();

    // Validate required fields
    if (!qr_payload) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required field: qr_payload',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse ticket ID from QR payload
    const ticketId = parseTicketIdFromQr(qr_payload);
    if (!ticketId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid QR payload format. Expected format: railpay:ticket:<ticket_id>',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Look up the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, status, validated_at, route_id, user_id, blockchain_token_id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Ticket not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if ticket is already used
    if (ticket.status === 'used' || ticket.validated_at) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Ticket has already been used',
          data: {
            ticket_id: ticket.id,
            status: ticket.status,
            validated_at: ticket.validated_at,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if ticket status is invalid
    if (ticket.status !== 'valid') {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Ticket is ${ticket.status}`,
          data: {
            ticket_id: ticket.id,
            status: ticket.status,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate ticket on blockchain if blockchain_token_id exists
    let blockchainTxHash: string | null = null;
    if (ticket.blockchain_token_id) {
      try {
        const ticketContract = getRailPayTicketContract();
        const tx = await ticketContract.validateTicket(ticket.blockchain_token_id);
        blockchainTxHash = tx.hash;
        
        // Wait for transaction confirmation
        await waitForTransaction(blockchainTxHash, 1);
      } catch (blockchainError) {
        console.error('Blockchain validation error:', blockchainError);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to validate ticket on blockchain',
            error: blockchainError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Mark ticket as used and set validation timestamp
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        validated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (updateError || !updatedTicket) {
      console.error('Error updating ticket:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to validate ticket',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log admin action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: userId,
        action_type: 'ticket_validation',
        resource_type: 'ticket',
        resource_id: ticketId,
        description: `Ticket validated via QR scan${device_id ? ` (device: ${device_id})` : ''}`,
        metadata: {
          qr_payload: qr_payload,
          device_id: device_id || null,
          blockchain_tx_hash: blockchainTxHash,
        },
      });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ticket validated successfully',
        data: {
          ticket_id: updatedTicket.id,
          status: updatedTicket.status,
          validated_at: updatedTicket.validated_at,
          route_id: updatedTicket.route_id,
          blockchain_tx_hash: blockchainTxHash,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in admin-scan-qr function:', error);
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

