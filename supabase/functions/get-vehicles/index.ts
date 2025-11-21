// Edge Function: get-vehicles
// Fetches available vehicles (active vehicles only for regular users, all vehicles for admins)

import { createSupabaseClient, getAuthenticatedUser, corsHeaders } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get authenticated user (optional - vehicles can be viewed by anyone)
    const userId = await getAuthenticatedUser(req);

    // Create Supabase client
    const supabase = createSupabaseClient(req);

    // Parse query parameters
    const url = new URL(req.url);
    const routeId = url.searchParams.get('route_id');
    const vehicleType = url.searchParams.get('vehicle_type');
    const status = url.searchParams.get('status');
    const includeInactive = url.searchParams.get('include_inactive') === 'true';

    // Build query
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status (unless include_inactive is true)
    if (!includeInactive && !status) {
      query = query.eq('status', 'active');
    } else if (status) {
      query = query.eq('status', status);
    }

    // Apply filters
    if (routeId) {
      query = query.eq('route_id', routeId);
    }

    if (vehicleType) {
      query = query.eq('vehicle_type', vehicleType);
    }

    // Execute query
    const { data: vehicles, error: vehiclesError } = await query;

    if (vehiclesError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to fetch vehicles',
          error: vehiclesError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return vehicles
    return new Response(
      JSON.stringify({
        success: true,
        data: vehicles || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-vehicles function:', error);
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

