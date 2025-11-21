// Edge Function: get-routes
// Fetches available routes (active routes only for regular users, all routes for admins)

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

    // Get authenticated user (optional - routes can be viewed by anyone)
    const userId = await getAuthenticatedUser(req);

    // Create Supabase client
    const supabase = createSupabaseClient(req);

    // Parse query parameters
    const url = new URL(req.url);
    const origin = url.searchParams.get('origin');
    const destination = url.searchParams.get('destination');
    const vehicleType = url.searchParams.get('vehicle_type');
    const includeInactive = url.searchParams.get('include_inactive') === 'true';

    // Build query
    let query = supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by active status (unless include_inactive is true)
    if (!includeInactive) {
      query = query.eq('active', true);
    }

    // Apply filters
    if (origin) {
      query = query.ilike('origin', `%${origin}%`);
    }

    if (destination) {
      query = query.ilike('destination', `%${destination}%`);
    }

    if (vehicleType) {
      query = query.eq('vehicle_type', vehicleType);
    }

    // Execute query
    const { data: routes, error: routesError } = await query;

    if (routesError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to fetch routes',
          error: routesError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return routes
    return new Response(
      JSON.stringify({
        success: true,
        data: routes || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-routes function:', error);
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

