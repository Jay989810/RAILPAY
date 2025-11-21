// Edge Function: verify-nin
// Verifies a user's National Identification Number (NIN) using Korapay API
// Updates the user's profile with verification status

import { createSupabaseClient, getAuthenticatedUser, corsHeaders } from '../_shared/supabase.ts';

/**
 * Calls Korapay NIN Lookup API to verify NIN
 * 
 * @param nin - National Identification Number
 * @param userId - User ID for reference generation
 * @returns Promise with verification result
 */
async function verifyNinWithKorapay(
  nin: string,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string; nameMatch?: boolean }> {
  try {
    const reference = `railpay_nin_${userId}`;
    
    // Korapay NIN verification API - no authentication/secret key required
    const response = await fetch('https://api.korapay.com/merchant/api/v1/identities/ng/nin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nin: nin,
        reference: reference,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || 'NIN verification failed',
      };
    }

    // Check if verification was successful
    // Korapay returns data in different formats, handle both
    if (responseData.status === 'success' || responseData.data || responseData.firstname) {
      return {
        success: true,
        data: responseData.data || responseData,
        nameMatch: true, // Will be verified separately
      };
    }

    return {
      success: false,
      error: responseData.message || 'NIN verification failed',
    };
  } catch (error) {
    console.error('Korapay API error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to NIN verification service',
    };
  }
}

/**
 * Compares user-provided name with NIN data for name matching
 * 
 * @param userFullName - Name provided by user
 * @param ninData - Data returned from Korapay API
 * @returns boolean indicating if names match
 */
function compareNames(userFullName: string, ninData: any): boolean {
  if (!ninData) {
    return false;
  }

  // Extract name from NIN data - handle different response formats
  let ninFullName = '';
  if (ninData.firstname && ninData.lastname) {
    ninFullName = `${ninData.firstname} ${ninData.lastname}`;
  } else if (ninData.first_name && ninData.last_name) {
    ninFullName = `${ninData.first_name} ${ninData.last_name}`;
  } else if (ninData.name) {
    ninFullName = ninData.name;
  } else if (ninData.full_name) {
    ninFullName = ninData.full_name;
  } else {
    return false;
  }

  const ninFullNameLower = ninFullName.toLowerCase().trim();
  const userFullNameLower = userFullName.toLowerCase().trim();

  // Exact match
  if (ninFullNameLower === userFullNameLower) {
    return true;
  }

  // Check if user name contains NIN name parts (fuzzy matching)
  const ninParts = ninFullNameLower.split(' ').filter(part => part.length > 2);
  const userParts = userFullNameLower.split(' ').filter(part => part.length > 2);

  // Check if all NIN name parts are present in user name
  const allPartsMatch = ninParts.every(part => 
    userParts.some(userPart => userPart.includes(part) || part.includes(userPart))
  );

  return allPartsMatch;
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
    const { nin, full_name, dob, phone } = await req.json();

    // Validate required fields
    if (!nin || !full_name || !dob || !phone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: nin, full_name, dob, phone',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createSupabaseClient(req);

    // Call Korapay NIN verification API
    const verificationResult = await verifyNinWithKorapay(nin, userId);

    // Store verification attempt in audit table
    const { error: verificationLogError } = await supabase
      .from('nin_verifications')
      .insert({
        user_id: userId,
        nin: nin,
        request_payload: { nin, full_name, dob, phone },
        response_payload: verificationResult,
        success: verificationResult.success,
      });

    if (verificationLogError) {
      console.error('Error logging NIN verification:', verificationLogError);
    }

    // If API call failed, return error
    if (!verificationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: verificationResult.error || 'NIN verification failed',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check name match if NIN data is available
    if (verificationResult.data) {
      const nameMatches = compareNames(full_name, verificationResult.data);
      
      if (!nameMatches) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Name mismatch. The name provided does not match the NIN record.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Update user profile with verified NIN information
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nin: nin,
        nin_verified: true,
        nin_verified_at: new Date().toISOString(),
        full_name: full_name,
        dob: dob,
        phone: phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to update profile',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'NIN verified successfully',
        data: {
          nin,
          verified_at: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in verify-nin function:', error);
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

