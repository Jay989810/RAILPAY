// Edge Function: admin-update-fare
// Admin updates fare (base_price) for a route

import { createSupabaseClient, getAuthenticatedUser, corsHeaders } from '../_shared/supabase.ts';

/**
 * Checks if user is admin
 */
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, role')
    .eq('user_id', userId)
    .eq('active', true)
    .single();

  if (error || !staff) {
    return false;
  }

  return staff.role === 'admin';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow PUT requests
    if (req.method !== 'PUT') {
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

    // Check if user is admin
    const isAuthorized = await isAdmin(supabase, userId);
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unauthorized. Admin access required.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { route_id, base_price } = await req.json();

    // Validate required fields
    if (!route_id || base_price === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: route_id, base_price',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate base_price is a positive number
    if (typeof base_price !== 'number' || base_price <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'base_price must be a positive number',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get current route information
    const { data: currentRoute, error: routeError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', route_id)
      .single();

    if (routeError || !currentRoute) {
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

    // Update route fare
    const { data: updatedRoute, error: updateError } = await supabase
      .from('routes')
      .update({
        base_price: base_price,
      })
      .eq('id', route_id)
      .select()
      .single();

    if (updateError || !updatedRoute) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to update fare',
          error: updateError?.message,
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
        action_type: 'fare_updated',
        resource_type: 'route',
        resource_id: route_id,
        description: `Updated fare for route: ${updatedRoute.origin} → ${updatedRoute.destination} (${currentRoute.base_price} → ${base_price})`,
        metadata: {
          old_price: currentRoute.base_price,
          new_price: base_price,
          route_origin: updatedRoute.origin,
          route_destination: updatedRoute.destination,
        },
      });

    // Return updated route
    return new Response(
      JSON.stringify({
        success: true,
        data: updatedRoute,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in admin-update-fare function:', error);
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

