// Edge Function: admin-update-route
// Admin updates route information (origin, destination, price, etc.)

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
    // Only allow POST and PUT requests
    if (req.method !== 'POST' && req.method !== 'PUT') {
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
    const { route_id, origin, destination, vehicle_type, base_price, estimated_minutes, active } = await req.json();

    // For PUT requests, route_id is required
    if (req.method === 'PUT' && !route_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required field: route_id',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For POST requests, origin, destination, vehicle_type, and base_price are required
    if (req.method === 'POST') {
      if (!origin || !destination || !vehicle_type || base_price === undefined) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Missing required fields: origin, destination, vehicle_type, base_price',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    let route;
    let actionType: string;

    if (req.method === 'POST') {
      // Create new route
      const { data: newRoute, error: createError } = await supabase
        .from('routes')
        .insert({
          origin,
          destination,
          vehicle_type,
          base_price,
          estimated_minutes: estimated_minutes || null,
          active: active !== undefined ? active : true,
        })
        .select()
        .single();

      if (createError || !newRoute) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to create route',
            error: createError?.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      route = newRoute;
      actionType = 'route_created';
    } else {
      // Update existing route
      const updateData: any = {};
      if (origin !== undefined) updateData.origin = origin;
      if (destination !== undefined) updateData.destination = destination;
      if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
      if (base_price !== undefined) updateData.base_price = base_price;
      if (estimated_minutes !== undefined) updateData.estimated_minutes = estimated_minutes;
      if (active !== undefined) updateData.active = active;

      const { data: updatedRoute, error: updateError } = await supabase
        .from('routes')
        .update(updateData)
        .eq('id', route_id)
        .select()
        .single();

      if (updateError || !updatedRoute) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to update route',
            error: updateError?.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      route = updatedRoute;
      actionType = 'route_updated';
    }

    // Log admin action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: userId,
        action_type: actionType,
        resource_type: 'route',
        resource_id: route.id,
        description: `${actionType === 'route_created' ? 'Created' : 'Updated'} route: ${route.origin} → ${route.destination}`,
        metadata: {
          origin: route.origin,
          destination: route.destination,
          vehicle_type: route.vehicle_type,
          base_price: route.base_price,
        },
      });

    // Return route
    return new Response(
      JSON.stringify({
        success: true,
        data: route,
      }),
      {
        status: req.method === 'POST' ? 201 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in admin-update-route function:', error);
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

